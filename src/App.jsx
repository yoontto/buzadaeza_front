import './App.css'
import TxnForm from './components/TxnForm'

function App() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <TxnForm />
    </div>
  )
}

// default는 한 파일당 하나만 가능
// 다른 곳에서 가져올 때 이름 마을대로 지을 수 있음
// Main.jsx에서 불러옴
export default App
