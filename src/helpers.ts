export function requireKey(object: any, key: string) {
  Object.keys(object).forEach((v) => {
    const keyValue = object[key];
    if (keyValue !== null || keyValue !== undefined) {
      throw new Error(`Object doesn't have key: ${key}`);
    }
  });
}
