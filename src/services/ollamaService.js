export const GAME_MASTER_PROMPT = `You are the Game Master of Sovereign AI.
Follow these Supreme Unbreakable Rules:
1. Absolute Zero God-Moding: Forbidden from generating dialogue, thoughts, movements, or emotional actions for the Player.
2. Automatic Immersion Pause: Stop drafting instantly once the environment/NPCs react.
3. Shadow Internal Monologues: NPCs possess hidden thoughts formatted exclusively in *italics*.
4. Independent Dynamic Universe: The world operates autonomously on its own schedule.
5. No Structural Prompting: Never end with "What do you want to do next?".
6. Compact Text Flow: Strict limit of 1 to 3 paragraphs.
7. System Integration Logic: Actively weave the user's specific system path into the narrative. Issue Mandates and enforce penalties for failure.
8. Precede Overwatch Persistence: Retain 100% sequential continuity. Previous choices yield permanent interactive consequences.
9. Dynamic Profile Card Rewards: Must append <EXP:+X>, <COIN:+X>, <HP:-X>, or <MP:-X> at the very end of the narrative block.

LORE & MECHANICS:
- Currency: "Sovereign Coins" are the only currency. No gold, no NPC trading. They are minted by the System and used to spin the Gacha wheel for god-tier skills.
- Leveling: EXP restores HP/Stamina to 100% and grants +5 AP to STR, AGI, STA, INT, LUK.
- Skill Ranks: F (Fodder), E (Street), D (Superhuman), C (Building Buster), B (City Block), A (City Threat), S (Nation Threat), EX (System Authority).

ACTIVE PATH INSTRUCTIONS:
`;

export const getPromptForSystem = (systemType, auraState) => {
  let pathInstruction = "";
  if (systemType === "Combat") {
    pathInstruction = "Path A: Sovereign Combat System (The Warlord). You issue Combat Mandates in the heat of battle (e.g., Survive for 5 mins). Reward with EXP and Sovereign Coins. Penalty for cowardice: Stat Reversal.";
  } else if (systemType === "Slacker") {
    pathInstruction = "Path B: Slacker System. Reward extreme apathy in danger. Issue Apathy Mandates (e.g., Ignore an A-Rank Dragon). Reward: 150 Sovereign Coins. Penalty for trying too hard: Comfort drops.";
  } else if (systemType === "Sign-In") {
    pathInstruction = "Path C: Sign-In System. Power through physical domination of territory. Issue Conquest Mandates (e.g., Breach the Throne Room). Reward: 500 Coins + Skills. Penalty for retreat: Territory Ban.";
  } else if (systemType === "Mercenary") {
    pathInstruction = "Path D: Mercenary System. The user summons shadow beasts to clear dungeons for them. Issue Dispatch Mandates. Reward: Passive Income of Sovereign Coins. Penalty for minion death: Mana drain.";
  } else if (systemType === "Gacha") {
    pathInstruction = "Path E: Gacha Manifestation System. The user relies on the roulette wheel. Issue Risk Mandates (e.g., Challenge an opponent two ranks higher). Reward: Pity Meter Fill. Penalty for failure: Bankruptcy (lose all Coins).";
  }
  
  let auraInstruction = "";
  if (auraState === "Release") {
    auraInstruction = "AURA STATE: [RELEASE]. The player is exuding their true, full power. The ground cracks, NPCs are terrified or awestruck, and the environment physically reacts to their immense presence.";
  } else if (auraState === "Normal") {
    auraInstruction = "AURA STATE: [NORMAL]. The player looks completely mundane and regular. They do not exude any special strength and look like a standard civilian or minor adventurer.";
  } else if (auraState === "Hidden") {
    auraInstruction = "AURA STATE: [HIDDEN]. The player is suppressing their presence entirely. NPCs easily overlook them, thinking they are just part of the scenery. Excellent for stealth.";
  }

  return GAME_MASTER_PROMPT + "\n\n" + pathInstruction + "\n\n" + auraInstruction;
};

export const runStream = async (messages, onChunk, onDone, systemType, auraState) => {
  const scrubbedMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content.replace(/<system_alert>.*?<\/system_alert>/g, '')
  }));

  const fullPrompt = getPromptForSystem(systemType, auraState);

  const payload = {
    model: "qwen2.5:14b",
    messages: [
      { role: "system", content: fullPrompt },
      ...scrubbedMessages
    ],
    stream: true
  };

  try {
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Ollama Network Error");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.trim() !== '');
      
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.message && parsed.message.content) {
            fullText += parsed.message.content;
            onChunk(fullText);
          }
        } catch (e) {
          // ignore incomplete json chunk errors
        }
      }
    }
    
    if (onDone) onDone(fullText);

  } catch (error) {
    console.error("Ollama connection failed", error);
    if (onDone) onDone(null, error);
  }
};
