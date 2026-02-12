import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import ReactMathEditor from '../src/index'; // 导入我们的组件
import 'antd/dist/reset.css'; // Ant Design 5.x 的新样式导入方式
import '../styles/mathType.less';


const App = () => {
  const [formula, setFormula] = useState<string>('\\frac{1}{x}');

  return (
    <div style={{ padding: '20px' }}>
      <h1>MathType Editor 演示</h1>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <ReactMathEditor 
          defaultValue={formula}
          onChange={(value) => setFormula(value)}
          style={{ width: '100%' }}
        />
        <div style={{ marginTop: '20px' }}>
          <h3>当前LaTeX:</h3>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
            {formula}
          </pre>
        </div>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);