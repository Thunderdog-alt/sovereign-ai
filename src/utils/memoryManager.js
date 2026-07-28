const MAX_MESSAGES = 650;

export function getLobbyState(lobbyId) {
  const data = localStorage.getItem(`lobby_state_${lobbyId}`);
  return data ? JSON.parse(data) : null;
}

export function saveLobbyState(lobbyId, state) {
  localStorage.setItem(`lobby_state_${lobbyId}`, JSON.stringify(state));
}

export function getMessages(lobbyId) {
  const data = localStorage.getItem(`messages_${lobbyId}`);
  return data ? JSON.parse(data) : [];
}

export function saveMessages(lobbyId, messages) {
  let msgs = [...messages];
  let vaultData = getVault(lobbyId);

  if (msgs.length > MAX_MESSAGES) {
    const overflow = msgs.length - MAX_MESSAGES;
    const toArchive = msgs.slice(0, overflow);
    msgs = msgs.slice(overflow);
    
    // Append to vault
    toArchive.forEach(m => {
      vaultData.archive += `[${m.role} - ${m.username || 'System'}]: ${m.content}\n\n`;
    });
    vaultData.archived_count += overflow;
    saveVault(lobbyId, vaultData);
  }

  localStorage.setItem(`messages_${lobbyId}`, JSON.stringify(msgs));
  return msgs; // Return the trimmed active messages
}

export function addMessage(lobbyId, message) {
  const msgs = getMessages(lobbyId);
  msgs.push(message);
  return saveMessages(lobbyId, msgs);
}

export function getVault(lobbyId) {
  const data = localStorage.getItem(`vault_${lobbyId}`);
  return data ? JSON.parse(data) : { archive: '', archived_count: 0 };
}

export function saveVault(lobbyId, vaultData) {
  localStorage.setItem(`vault_${lobbyId}`, JSON.stringify(vaultData));
}

export function clearChat(lobbyId) {
  localStorage.removeItem(`messages_${lobbyId}`);
  localStorage.removeItem(`vault_${lobbyId}`);
}
