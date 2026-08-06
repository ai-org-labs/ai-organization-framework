import { buildModelInputPacket, firstActorWithRole } from "./packet.js";

const STAGE_MATRIX = {
  clarification: {
    primary: "Visionary",
    participants: [],
    approvalMode: "single"
  },
  planning: {
    primary: "Builder",
    participants: [
      { role: "Visionary", mode: "required" },
      { role: "Guardian", mode: "required" }
    ],
    approvalMode: "single"
  },
  proposal: {
    primary: "Builder",
    participants: [
      { role: "Visionary", mode: "required" },
      { role: "Guardian", mode: "optional" }
    ],
    approvalMode: "single"
  },
  review: {
    primary: "Guardian",
    participants: [
      { role: "Visionary", mode: "optional" },
      { role: "Builder", mode: "required" }
    ],
    approvalMode: "review-with-veto"
  },
  approval: {
    primary: "Visionary",
    participants: [
      { role: "Builder", mode: "required" },
      { role: "Guardian", mode: "required" }
    ],
    approvalMode: "sequential-all-seat"
  }
};

const FAST_TRACK_STAGE_MATRIX = {
  clarification: {
    primary: "Visionary",
    participants: [],
    approvalMode: "single"
  },
  planning: {
    primary: "Builder",
    participants: [],
    approvalMode: "single"
  },
  proposal: {
    primary: "Builder",
    participants: [],
    approvalMode: "single"
  },
  review: {
    primary: "Guardian",
    participants: [],
    approvalMode: "single"
  },
  approval: {
    primary: "Guardian",
    participants: [],
    approvalMode: "single-reviewer"
  }
};

function resolveReopenRole(session, roleOverride) {
  if (roleOverride) {
    return roleOverride;
  }

  const triggerClasses = session.clarification?.trigger_classes ?? [];
  if (triggerClasses.includes("high-stakes-risk")) {
    return "Guardian";
  }
  if (triggerClasses.includes("external-signal")) {
    return "Visionary";
  }
  return "Visionary";
}

function stageConfigFor(stage, session, roleOverride) {
  if (stage === "reopen") {
    const primary = resolveReopenRole(session, roleOverride);
    const participants = primary === "Guardian"
      ? [{ role: "Builder", mode: "required" }]
      : [{ role: "Builder", mode: "optional" }, { role: "Guardian", mode: "optional" }];
    return {
      primary,
      participants,
      approvalMode: "single"
    };
  }

  const routingMode = session.routing_mode ?? "deep-path";
  const matrix = routingMode === "fast-track" ? FAST_TRACK_STAGE_MATRIX : STAGE_MATRIX;
  const config = matrix[stage];
  if (!config) {
    throw new Error(`Unsupported council stage: ${stage}`);
  }
  return config;
}

function buildSeatPlan({ template, session, stage, role, mode, lane }) {
  const actor = firstActorWithRole(template.actors, role);
  if (!actor) {
    throw new Error(`Role routing failed closed: no actor found for required role '${role}' during ${stage}.`);
  }
  return {
    role,
    actor_ref: actor.actor_id,
    participation_mode: mode,
    lane,
    packet: buildModelInputPacket({
      template,
      session,
      stage,
      roleOverride: role
    })
  };
}

function normalizeRoleName(role) {
  return String(role ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function uniqueRoles(roles) {
  const seen = new Set();
  const unique = [];
  for (const role of roles) {
    const roleText = String(role ?? "").trim();
    const key = normalizeRoleName(roleText);
    if (!roleText || seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(roleText);
  }
  return unique;
}

function additionalRequiredRoles({ seats, requiredRoles }) {
  const planned = new Set(seats.map((seat) => normalizeRoleName(seat.role)));
  return uniqueRoles(requiredRoles).filter((role) => !planned.has(normalizeRoleName(role)));
}

export function buildCouncilExecutionPlan({ template, session, stage, includeOptional = false, roleOverride = "", requiredRoles = [] }) {
  const config = stageConfigFor(stage, session, roleOverride);
  const primary = buildSeatPlan({
    template,
    session,
    stage,
    role: config.primary,
    mode: "primary",
    lane: "primary"
  });

  const participants = config.participants
    .filter((participant) => participant.mode === "required" || includeOptional)
    .map((participant) =>
      buildSeatPlan({
        template,
        session,
        stage,
        role: participant.role,
        mode: participant.mode,
        lane: "follow-up"
      })
    );
  const explicitRequiredRoles = uniqueRoles([
    ...(session.required_actor_roles ?? []),
    ...(session.required_role_refs ?? []),
    ...requiredRoles
  ]);
  const specialistParticipants = additionalRequiredRoles({
    seats: [primary, ...participants],
    requiredRoles: explicitRequiredRoles
  }).map((requiredRole) =>
    buildSeatPlan({
      template,
      session,
      stage,
      role: requiredRole,
      mode: "required-specialist",
      lane: "specialist"
    })
  );
  const seats = [primary, ...participants, ...specialistParticipants];

  return {
    stage,
    routing_mode: session.routing_mode ?? "deep-path",
    execution_model: "single-instance-role-switching",
    primary_role: config.primary,
    approval_mode: config.approvalMode,
    required_roles: uniqueRoles([config.primary, ...participants.filter((participant) => participant.participation_mode !== "optional").map((participant) => participant.role), ...explicitRequiredRoles]),
    unresolved_roles: [],
    routing_status: "ready",
    seats
  };
}
