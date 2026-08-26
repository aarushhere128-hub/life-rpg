import { db } from "../firebase/config.js";
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  writeBatch,
  Timestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- GOAL OPERATIONS ---
export async function createGoal(userId, { title, description, category }) {
  const goalRef = doc(collection(db, "goals"));
  const goalId = goalRef.id;

  await setDoc(goalRef, {
    goalId,
    userId,
    title,
    description,
    category,
    status: "ACTIVE",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return goalId;
}

export async function fetchUserGoals(userId) {
  const q = query(collection(db, "goals"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

// --- QUEST OPERATIONS ---
export async function createQuest(userId, { goalId, title, description, difficulty, estimatedMinutes, dueAtDays = 1, source = "USER_CREATED" }) {
  const questRef = doc(collection(db, "quests"));
  const questId = questRef.id;

  // Calculate default dueAt 24 hours from now to satisfy rules
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + dueAtDays);
  const dueAtTimestamp = Timestamp.fromDate(futureDate);

  await setDoc(questRef, {
    questId,
    userId,
    goalId,
    title,
    description,
    difficulty: Number(difficulty),
    estimatedMinutes: Number(estimatedMinutes),
    status: "AVAILABLE",
    source,
    createdAt: serverTimestamp(),
    dueAt: dueAtTimestamp,
    completedAt: null
  });

  return questId;
}

export async function fetchUserQuests(userId) {
  const q = query(collection(db, "quests"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

export async function updateQuestStatus(questId, newStatus) {
  if (!questId) {
    throw new Error("updateQuestStatus: missing questId");
  }
  const questRef = doc(db, "quests", questId);
  const updateData = { status: newStatus };
  if (newStatus === "COMPLETED_PENDING_VERIFICATION") {
    updateData.completedAt = serverTimestamp();
  }
  try {
    await updateDoc(questRef, updateData);
  } catch (err) {
    console.error("Firestore updateQuestStatus failed for", questId, "->", newStatus, err);
    throw err;
  }
}

// --- AI PROPOSAL OPERATIONS (ATOMIC BATCH) ---
export async function fetchUserProposals(userId) {
  const q = query(collection(db, "questProposals"), where("userId", "==", userId), where("status", "==", "PENDING"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}

export async function approveProposal(userId, proposal) {
  if (!userId) {
    throw new Error("approveProposal: missing userId");
  }
  if (!proposal || !proposal.proposalId) {
    throw new Error("approveProposal: missing proposal or proposalId");
  }
  if (proposal.status !== 'PENDING') {
    throw new Error("approveProposal: proposal must be PENDING to approve");
  }

  const batch = writeBatch(db);

  // 1. Create the new quest reference atomically
  const questRef = doc(collection(db, "quests"));
  const questId = questRef.id;

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);

  batch.set(questRef, {
    questId,
    userId,
    goalId: proposal.goalId,
    title: proposal.title,
    description: proposal.description,
    difficulty: Number(proposal.difficulty),
    estimatedMinutes: Number(proposal.estimatedMinutes),
    status: "AVAILABLE",
    source: "AI_APPROVED",
    createdAt: serverTimestamp(),
    dueAt: Timestamp.fromDate(futureDate),
    completedAt: null,
    proposalId: proposal.proposalId
  });

  // 2. Mark proposal approved in the same atomic transaction
  const proposalRef = doc(db, "questProposals", proposal.proposalId);
  batch.update(proposalRef, { status: "APPROVED", updatedAt: serverTimestamp() });

  // Commit both writes atomically
  try {
    await batch.commit();
  } catch (err) {
    console.error("approveProposal: batch commit failed for proposalId=", proposal.proposalId, err);
    throw err;
  }
}

export async function dismissProposal(proposalId) {
  const proposalRef = doc(db, "questProposals", proposalId);
  try {
    await updateDoc(proposalRef, { status: "DISMISSED", updatedAt: serverTimestamp() });
  } catch (err) {
    console.error("dismissProposal failed for proposalId=", proposalId, err);
    throw err;
  }
}
