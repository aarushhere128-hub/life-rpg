import { initAuthGuard, logoutUser } from "../firebase/auth.js";
import { 
  createGoal, 
  fetchUserGoals, 
  createQuest, 
  fetchUserQuests, 
  updateQuestStatus, 
  fetchUserProposals, 
  approveProposal, 
  dismissProposal 
} from "../quests/quest-manager.js";

document.getElementById("logoutBtn").addEventListener("click", logoutUser);

initAuthGuard(async (user) => {
  const errorDiv = document.getElementById("questsError");
  const goalsSelect = document.getElementById("questGoalSelect");
  const goalsList = document.getElementById("goalsList");
  const questsList = document.getElementById("questsList");
  const proposalsSection = document.getElementById("proposalsSection");
  const proposalsList = document.getElementById("proposalsList");

  async function loadData() {
    try {
      errorDiv.textContent = "";
      
      // Load Goals securely using textContent
      const goals = await fetchUserGoals(user.uid);
      goalsSelect.innerHTML = '<option value="">Select Target Goal</option>';
      goalsList.innerHTML = "";
      
      if (goals.length === 0) {
        const p = document.createElement("p");
        p.className = "muted";
        p.textContent = "No active goals forged yet.";
        goalsList.appendChild(p);
      }
      
      goals.forEach(goal => {
        const opt = document.createElement("option");
        opt.value = goal.goalId;
        opt.textContent = goal.title;
        goalsSelect.appendChild(opt);

        const row = document.createElement("div");
        row.className = "rpg-item-row";
        
        const contentDiv = document.createElement("div");
        const titleStrong = document.createElement("strong");
        titleStrong.textContent = goal.title;
        
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = goal.category;
        
        const descP = document.createElement("p");
        descP.className = "muted";
        descP.textContent = goal.description || "No description";

        contentDiv.appendChild(titleStrong);
        contentDiv.appendChild(document.createTextNode(" "));
        contentDiv.appendChild(badge);
        contentDiv.appendChild(descP);
        row.appendChild(contentDiv);
        goalsList.appendChild(row);
      });

      // Load Quests securely
      const quests = await fetchUserQuests(user.uid);
      questsList.innerHTML = "";
      
      if (quests.length === 0) {
        const p = document.createElement("p");
        p.className = "muted";
        p.textContent = "No quests available.";
        questsList.appendChild(p);
      }
      
      quests.forEach(quest => {
        const row = document.createElement("div");
        row.className = "rpg-item-row";

        const contentDiv = document.createElement("div");
        const titleStrong = document.createElement("strong");
        titleStrong.textContent = quest.title;

        const badge = document.createElement("span");
        badge.className = `badge status-${quest.status.toLowerCase()}`;
        badge.textContent = quest.status;

        const metaP = document.createElement("p");
        metaP.className = "muted";
        metaP.textContent = `Difficulty: ${quest.difficulty} | Est: ${quest.estimatedMinutes}m | Source: ${quest.source}`;

        contentDiv.appendChild(titleStrong);
        contentDiv.appendChild(document.createTextNode(" "));
        contentDiv.appendChild(badge);
        contentDiv.appendChild(metaP);
        row.appendChild(contentDiv);

        const actionDiv = document.createElement("div");
        if (quest.status === 'AVAILABLE') {
          const btn = document.createElement("button");
          btn.className = "rpg-btn-sm";
          btn.textContent = "Accept";
          btn.addEventListener("click", async () => {
            try {
              errorDiv.textContent = "";
              await updateQuestStatus(quest.questId, 'ACCEPTED');
              await loadData();
            } catch (err) {
              console.error("Failed to accept quest:", err);
              errorDiv.textContent = "Failed to accept quest: " + (err.message || err);
            }
          });
          actionDiv.appendChild(btn);
        } else if (quest.status === 'ACCEPTED') {
          const btn = document.createElement("button");
          btn.className = "rpg-btn-sm primary";
          btn.textContent = "Complete & Submit";
          btn.addEventListener("click", async () => {
            try {
              errorDiv.textContent = "";
              await updateQuestStatus(quest.questId, 'COMPLETED_PENDING_VERIFICATION');
              await loadData();
            } catch (err) {
              console.error("Failed to submit quest:", err);
              errorDiv.textContent = "Failed to submit quest: " + (err.message || err);
            }
          });
          actionDiv.appendChild(btn);
        }
        row.appendChild(actionDiv);
        questsList.appendChild(row);
      });

      // Load AI Proposals securely
      const proposals = await fetchUserProposals(user.uid);
      if (proposals.length > 0) {
        proposalsSection.classList.remove("hidden");
        proposalsList.innerHTML = '';
        proposals.forEach(prop => {
          const row = document.createElement("div");
          row.className = "rpg-item-row proposal-row";

          const contentDiv = document.createElement("div");
          const titleStrong = document.createElement("strong");
          titleStrong.textContent = prop.title;
          const reasonP = document.createElement("p");
          reasonP.className = "muted";
          reasonP.textContent = prop.reason;

          contentDiv.appendChild(titleStrong);
          contentDiv.appendChild(reasonP);
          row.appendChild(contentDiv);

          const actionDiv = document.createElement("div");
          const approveBtn = document.createElement("button");
          approveBtn.className = "rpg-btn-sm";
          approveBtn.textContent = "Approve";
          approveBtn.addEventListener("click", async () => {
            try {
              errorDiv.textContent = "";
              await approveProposal(user.uid, prop); // pass user.uid (fixed signature)
              await loadData();
            } catch (err) {
              console.error("Failed to approve proposal:", err);
              errorDiv.textContent = "Failed to approve proposal: " + (err.message || err);
            }
          });

          const dismissBtn = document.createElement("button");
          dismissBtn.className = "rpg-btn-sm danger";
          dismissBtn.textContent = "Dismiss";
          dismissBtn.addEventListener("click", async () => {
            try {
              errorDiv.textContent = "";
              await dismissProposal(prop.proposalId);
              await loadData();
            } catch (err) {
              console.error("Failed to dismiss proposal:", err);
              errorDiv.textContent = "Failed to dismiss proposal: " + (err.message || err);
            }
          });

          actionDiv.appendChild(approveBtn);
          actionDiv.appendChild(dismissBtn);
          row.appendChild(actionDiv);

          proposalsList.appendChild(row);
        });
      } else {
        proposalsSection.classList.add("hidden");
      }

    } catch (err) {
      console.error("Error loading quest board:", err);
      errorDiv.textContent = "Failed to load quest board data. Check connection.";
    }
  }

  // Form Submission: Goals
  document.getElementById("goalForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await createGoal(user.uid, {
        title: document.getElementById("goalTitle").value,
        description: document.getElementById("goalDesc").value,
        category: document.getElementById("goalCategory").value
      });
      e.target.reset();
      loadData();
    } catch (err) {
      errorDiv.textContent = "Permission denied or invalid goal data.";
    }
  });

  // Form Submission: Quests
  document.getElementById("questForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await createQuest(user.uid, {
        goalId: document.getElementById("questGoalSelect").value,
        title: document.getElementById("questTitle").value,
        description: document.getElementById("questDesc").value,
        difficulty: document.getElementById("questDifficulty").value,
        estimatedMinutes: document.getElementById("questDuration").value,
        source: "USER_CREATED"
      });
      e.target.reset();
      loadData();
    } catch (err) {
      errorDiv.textContent = "Permission denied: Ensure goal belongs to you.";
    }
  });

  loadData();
});
