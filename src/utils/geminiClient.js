const API_KEYS = [
  atob("QVEuQWI4Uk42SmhUX2NQVDZudEdSMk5Qb0Q0QVZrV09JelhHTG9pWUIwMFJIOUQxN2daV2c="),
  atob("QVEuQWI4Uk42SXNYMHc4anZyX0JMT0ZJR1l4TWJ0ZzRoWDZDTEd4aWc2OFpzRUhPMEhkY3c="),
  atob("QVEuQWI4Uk42SkNId1Z0X3EyS2FoWG1SbnV6TjE0d3g3THpjQzJITUxRYm9mWG1qZjRGOWc="),
  atob("QVEuQWI4Uk42SUc2MEpRY2gtRUxyTXV2MlJKUmRubTFYVUVwdE02NmVNdEh5dk5JTEpFNlE=")
];

let currentKeyIndex = 0;

export async function callGemini(prompt, history) {
  const model = "gemini-1.5-flash";
  const apiKey = API_KEYS[currentKeyIndex];
  
  // Rotate key for next call
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;

  const contents = [
    ...(history || []).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    })),
    { role: 'user', parts: [{ text: prompt }] }
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'The Game Master remains silent.';
}
