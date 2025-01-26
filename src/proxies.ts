export interface MethodCallHistory {
  method: string;
  arguments: any[];
}

export function recordMethodCalls<T extends object>(
  object: T,
  parentPath: string = ""
) {
  const history: MethodCallHistory[] = [];

  const createHandler = (path: string): ProxyHandler<T> => ({
    get(target: T, prop: string | symbol, _receiver: any) {
      const value = target[prop as keyof T];
      const currentPath = path ? `${path}.${prop.toString()}` : prop.toString();

      if (typeof value === "function") {
        return (...args: any[]) => {
          history.push({ method: currentPath, arguments: args });
          return value.apply(target, args);
        };
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        // Create a new proxy for nested objects
        const nestedHandler = createHandler(currentPath);
        return new Proxy(value, nestedHandler as ProxyHandler<object>);
      } else {
        return value;
      }
    },
  });

  return {
    proxied: new Proxy(object, createHandler(parentPath)),
    history,
  };
}
