import React from 'react';
import 'mathlive';
import 'katex/dist/katex.css';
import '../styles/mathType.less';
export interface MathEditorProps {
    defaultValue?: string;
    onChange?: (value: string) => void;
    style?: React.CSSProperties;
}
declare const MathEditor: React.FC<MathEditorProps>;
export default MathEditor;
//# sourceMappingURL=MathTypeEditor.d.ts.map