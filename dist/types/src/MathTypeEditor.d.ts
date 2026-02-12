import React from 'react';
import 'mathlive';
import 'katex/dist/katex.css';
import '../styles/mathType.less';
export interface MathTypeEditorProps {
    defaultValue?: string;
    onChange?: (value: string) => void;
    style?: React.CSSProperties;
}
declare const MathTypeEditor: React.FC<MathTypeEditorProps>;
export default MathTypeEditor;
//# sourceMappingURL=MathTypeEditor.d.ts.map