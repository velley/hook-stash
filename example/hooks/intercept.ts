import { HttpIntercept, HTTP_INTERCEPT } from "../../domain/http";


export function useIntercept(): HttpIntercept {
  return {
    requestIntercept: options => {
      return new Promise(resolve => resolve({...options, headers: {token: 'xxx'}}))
    },
    responseIntercept: res => {
      return new Promise((resolve, reject) => {
        resolve(res.data)
      })
    }
  }
}

useIntercept.token = HTTP_INTERCEPT;