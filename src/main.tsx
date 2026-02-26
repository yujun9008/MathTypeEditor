import React from 'react';
import ReactDOM from 'react-dom/client';
import MathEditor from './MathTypeEditor';
import 'katex/dist/katex.css';
import '../styles/mathType.less';

const App = () => {
  const [formula, setFormula] = React.useState<string>('');

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>MathType Editor - 开发预览</h1>
      <div style={{ maxWidth: '800px', margin: '20px auto' }}>
        <MathEditor
          defaultValue={formula}
          onChange={(value) => setFormula(value)}
          style={{ width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '16px' }}
        />
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);