export function reversePromise(promise) {
  return promise.then(() =>
    Promise.reject('resolved')
  ).catch(() =>
    Promise.resolve('rejected')
  )
}
