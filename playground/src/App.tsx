import { useState } from 'react'
import logo from './assets/react.svg'


function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <img src={logo} />
      <span>{count}</span>
      <button onClick={() => setCount(count + 1)}>click</button>
    </div>
  )
}

export default App
