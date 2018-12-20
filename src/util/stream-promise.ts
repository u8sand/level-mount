export function streamPromise<T>(stream): Promise<T[]> {
  return new Promise((resolve, reject) => {
    let data: any = []
    stream
      .on('data', (e) => {
        data = data.concat(e)
      })
      .on('error', function (e) {
        reject(e)
      })
      .on('close', () => {
        resolve(data)
      })
      .on('end', () => {
        resolve(data)
      })
  })
}
