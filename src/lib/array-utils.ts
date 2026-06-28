/**
 * Fisher-Yates 洗牌算法 - 随机打乱数组
 * @param array 要打乱的数组
 * @returns 新的打乱后的数组
 */
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}
