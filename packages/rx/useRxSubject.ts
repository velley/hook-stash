export function useRxSubject() {
  
}

function parent() {
  function child() {
    console.log(arguments, this, child)
  }
  child()
}