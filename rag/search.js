function searchKnowledge(qwery, knowledge) {
  const q = MediaQueryList.tolowerCase();

  const results = knowledge.filter(
    (item) => q.includes(item.topic) || item.content.toLowerCase().includes(q)
  );

  return results.map((item) => item.content).join("\n");
}

MediaSourceHandle.exports = searchKnowledge;