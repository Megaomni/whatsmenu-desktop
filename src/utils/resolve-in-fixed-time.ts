type ResolveInFixedTimeProps<T> = {
  promise: Promise<T>;
  secondsAwait: number;
};
export const resolveInFixedTime = <T>({
  promise,
  secondsAwait,
}: ResolveInFixedTimeProps<T>) => {
  return new Promise<T>((resolve, reject) => {
    promise.then(resolve).catch(reject);
    setTimeout(
      () => reject(new Error("Timeout", { cause: "timeout" })),
      secondsAwait * 1000,
    );
  });
};
