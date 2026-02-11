"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const antd_1 = require("antd");
const katex_1 = __importDefault(require("katex"));
const react_1 = require("react");
const const_1 = require("./const");
require("mathlive");
require("katex/dist/katex.css");
require("../styles/mathType.less");
const MathEditor = ({ defaultValue, onChange, style }) => {
    const [activeKey, setActiveKey] = (0, react_1.useState)(const_1.KATEXLIST[0]?.name || '1');
    const [editMode, setEditMode] = (0, react_1.useState)('mathlive');
    const [latexVal, setLatexVal] = (0, react_1.useState)(defaultValue || '');
    const mfRef = (0, react_1.useRef)(null);
    // Initialize value when opening or defaultValue prop changes
    (0, react_1.useEffect)(() => {
        const initialValue = defaultValue || '';
        setLatexVal(initialValue);
        // 延迟赋值，确保 DOM 已挂载
        setTimeout(() => {
            if (mfRef.current && mfRef.current.value !== initialValue) {
                let val = initialValue.trim();
                // 如果是 $ 开头结尾，去掉 $，方便 MathLive 识别
                if (val.startsWith('$') && val.endsWith('$') && val.length > 2) {
                    val = val.slice(1, -1);
                }
                mfRef.current.value = val;
            }
        }, 100);
    }, [defaultValue]);
    // Sync internal changes to parent
    (0, react_1.useEffect)(() => {
        if (onChange) {
            onChange(latexVal);
        }
    }, [latexVal]);
    // Sync latexVal to mathfield when switching to mathlive mode or when latexVal changes externally
    // But be careful not to create a loop.
    // We use effects to sync when switching modes primarily.
    const handleModeChange = (key) => {
        setEditMode(key);
        if (key === 'mathlive') {
            // Latex -> MathLive
            setTimeout(() => {
                if (mfRef.current) {
                    let val = latexVal.trim();
                    // 如果是 $ 开头结尾，去掉 $，方便 MathLive 识别
                    if (val.startsWith('$') && val.endsWith('$') && val.length > 2) {
                        val = val.slice(1, -1);
                    }
                    mfRef.current.value = val;
                }
            }, 0);
        }
        else if (mfRef.current) {
            // MathLive -> Latex
            setLatexVal(mfRef.current.getValue());
        }
    };
    // Handle MathLive input changes
    (0, react_1.useEffect)(() => {
        let isMounted = true;
        let cleanup;
        const initListeners = () => {
            if (!isMounted)
                return;
            const mf = mfRef.current;
            if (mf) {
                // 注入滚动条样式到 Shadow DOM
                if (mf.shadowRoot) {
                    const styleEl = document.createElement('style');
                    styleEl.textContent = `
            /* Webkit scrollbar styling */
            .ML__latex {
                width: 100% !important;
                display:flex !important;
                min-height: unset !important; /* 允许内容撑开高度 */
            }

            .ML__base {
                flex:1;
                display:flex !important;
                flex-wrap:wrap;
                gap: 10px 0px ;
                align-items:center;
                overflow: hidden; 
                width: 100%;
            }
            ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            ::-webkit-scrollbar-track {
              background: #f1f1f1; 
              border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb {
              background: #ccc; 
              border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: #bbb;
            }
            
            /* Ensure the host and internal containers allow scrolling */
            :host {
              overflow: auto;
              display: block;
              max-height: 250px; /* 控制整个 math-field 的最大高度 */
            }
            /* MathLive 内部容器类通常是 .ML__field-container 或 .ML__content 
               我们针对这些容器设置滚动行为 */
            .ML__field-container, .ML__content, .ML__container {
              overflow: visible !important;
              max-height: inherit;
            }
          `;
                    // 避免重复添加
                    if (!mf.shadowRoot.querySelector('style[data-custom-scrollbar]')) {
                        styleEl.setAttribute('data-custom-scrollbar', 'true');
                        mf.shadowRoot.appendChild(styleEl);
                    }
                }
                const onInput = (_evt) => {
                    // Update local state to keep in sync
                    setLatexVal(mf.getValue());
                };
                // 辅助函数：分割包含LaTeX命令的文本，正确处理嵌套大括号
                const splitWithLatexCommands = (text) => {
                    const regex = /\\x(?:longequal|xrightarrow|xleftarrow)\{(?:[^{}]|\{[^{}]*\})*\}/g;
                    const result = [];
                    let lastIndex = 0;
                    // 创建一个新的正则表达式实例用于执行exec
                    const execRegex = new RegExp(regex.source, 'g');
                    // 先获取第一个匹配项
                    let match = execRegex.exec(text);
                    while (match !== null) {
                        // 添加匹配前的文本
                        if (match.index > lastIndex) {
                            result.push(text.substring(lastIndex, match.index));
                        }
                        // 添加匹配的LaTeX命令
                        result.push(match[0]);
                        lastIndex = match.index + match[0].length;
                        // 获取下一个匹配项
                        match = execRegex.exec(text);
                    }
                    // 添加最后剩余的文本
                    if (lastIndex < text.length) {
                        result.push(text.substring(lastIndex));
                    }
                    return result;
                };
                const onPaste = (e) => {
                    const text = e.clipboardData?.getData('text/plain');
                    // 辅助函数：修复常见的 LaTeX 格式错误（包括大括号不匹配、环境未闭合等）
                    const fixLatex = (latex) => {
                        let current = latex;
                        // 1. 清理末尾可能的无效反斜杠（防止转义了后续补全的闭合符）
                        // 如果以奇数个反斜杠结尾，去掉最后一个
                        if (/\\+$/.test(current)) {
                            const backslashMatch = current.match(/\\+$/);
                            if (backslashMatch && backslashMatch[0].length % 2 !== 0) {
                                current = current.slice(0, -1);
                            }
                        }
                        // 2. 补全未闭合的环境 \begin{xxx} ... \end{xxx}
                        const stack = [];
                        // 简单的正则匹配 \begin{...} 和 \end{...}
                        // 注意：这里简化处理，假设环境名中不包含花括号
                        const envRegex = /\\(begin|end)\{([^}]+)\}/g;
                        let match;
                        // eslint-disable-next-line no-cond-assign
                        while ((match = envRegex.exec(current)) !== null) {
                            const type = match[1];
                            const envName = match[2];
                            if (type === 'begin') {
                                stack.push(envName);
                            }
                            else if (type === 'end') {
                                const lastEnv = stack[stack.length - 1];
                                if (lastEnv === envName) {
                                    stack.pop();
                                }
                            }
                        }
                        // 补全剩余的环境
                        while (stack.length > 0) {
                            const env = stack.pop();
                            current += `\\end{${env}}`;
                        }
                        // 3. 补全未闭合的花括号 {}
                        // 需要正确处理转义字符 \{ 和 \}
                        let braceBalance = 0;
                        let i = 0;
                        while (i < current.length) {
                            const char = current[i];
                            if (char === '\\') {
                                // 跳过转义字符（包括 \{, \}, \\ 等）
                                i += 2;
                                continue;
                            }
                            if (char === '{') {
                                braceBalance++;
                            }
                            else if (char === '}') {
                                if (braceBalance > 0) {
                                    braceBalance--;
                                }
                                // 如果 braceBalance 已经是 0，遇到了多余的 }，这里选择忽略它（不处理），
                                // 因为删除可能会破坏用户意图，且通常 MathLive 能容忍多余的闭合
                            }
                            i++;
                        }
                        // 补全剩余的花括号
                        while (braceBalance > 0) {
                            current += '}';
                            braceBalance--;
                        }
                        return current;
                    };
                    if (text) {
                        e.preventDefault();
                        let latexToInsert = text;
                        const hasChinese = /[\u4E00-\u9FA5]/.test(text);
                        // 检查是否包含LaTeX分隔符或命令（不仅仅是$...$或\(...\)）
                        const hasDollar = text.includes('$');
                        const hasParen = text.includes('\\(') && text.includes('\\)');
                        const hasBracket = text.includes('\\[') && text.includes('\\]');
                        // 扩展 LaTeX 命令列表，包含更多常用数学符号和命令，以避免误判为普通文本
                        const latexCommandRegex = /\\(?:text|mathrm|mathbf|frac|sum|int|lim|alpha|beta|gamma|delta|theta|pi|phi|omega|Delta|Phi|Omega|hat|tilde|dot|ddot|vec|over|under|substack|left|right|begin|end|xlongequal|xrightarrow|xleftarrow|bar|sqrt|pm|times|div|cdot|leq|geq|neq|approx|infty|partial)\b/;
                        const hasLatexCommands = latexCommandRegex.test(text);
                        const hasDelimiters = hasDollar || hasParen || hasBracket || hasLatexCommands;
                        // 检查是否包含化学反应箭头命令，如果是，则整个文本应作为单一公式处理
                        const hasChemicalArrow = /\\x(?:longequal|xrightarrow|xleftarrow)/.test(text);
                        if (hasChemicalArrow) {
                            // 化学方程式，整个内容作为单一公式处理，不需要额外处理
                            latexToInsert = text;
                        }
                        else if (hasDelimiters) {
                            // 处理混合模式：将普通文本包裹在 \text{} 中，公式部分保留
                            // 首先使用辅助函数分割LaTeX命令和其他部分
                            const parts = splitWithLatexCommands(text);
                            latexToInsert = parts
                                .map((part) => {
                                // 检查是否是LaTeX命令（如\xlongequal{...}）
                                if (/^\\x(?:longequal|xrightarrow|xleftarrow)\{(?:[^{}]|\{[^{}]*\})*\}$/.test(part)) {
                                    // LaTeX命令部分，直接返回
                                    return part;
                                }
                                else {
                                    // 非LaTeX命令部分，可能是普通文本或其他分隔符，继续处理
                                    // 先分割其他类型的分隔符
                                    const subParts = part.split(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\(.+?\\\)|(\$[^$]+\$))/g);
                                    return subParts
                                        .map((subPart) => {
                                        if (!subPart)
                                            return '';
                                        // 检查是否是 LaTeX 分隔符包围的内容（如 \[...\], \(...\), $$...$$, $...$）
                                        const isDelimitedFormula = (subPart.startsWith('$$') && subPart.endsWith('$$'))
                                            || (subPart.startsWith('\\[') && subPart.endsWith('\\]'))
                                            || (subPart.startsWith('\\(') && subPart.endsWith('\\)'))
                                            || (subPart.startsWith('$') && subPart.endsWith('$'));
                                        if (isDelimitedFormula) {
                                            // 对于已分隔的公式，移除分隔符并递归清理内部的 LaTeX 分隔符
                                            let content = subPart;
                                            let clean = true;
                                            while (clean) {
                                                clean = false;
                                                content = content.trim();
                                                if (content.startsWith('$$') && content.endsWith('$$')) {
                                                    content = content.slice(2, -2);
                                                    clean = true;
                                                }
                                                else if (content.startsWith('\\[') && content.endsWith('\\]')) {
                                                    content = content.slice(2, -2);
                                                    clean = true;
                                                }
                                                else if (content.startsWith('\\(') && content.endsWith('\\)')) {
                                                    content = content.slice(2, -2);
                                                    clean = true;
                                                }
                                                else if (content.startsWith('$') && content.endsWith('$') && content.length > 2) {
                                                    content = content.slice(1, -1);
                                                    clean = true;
                                                }
                                            }
                                            return content;
                                        }
                                        // 如果 subPart 包含明显的 LaTeX 命令，且没有外层分隔符，则直接视为公式返回，不包裹 \text{}
                                        // 避免将类似 \bar{d}Q 这样的裸公式错误地转义为 \text{\bar{d}Q}
                                        if (latexCommandRegex.test(subPart)) {
                                            return subPart;
                                        }
                                        // 是非公式文本，处理换行并包裹 \text{}
                                        // 如果文本全是空白字符，直接返回空格
                                        if (!subPart.trim()) {
                                            return '';
                                        }
                                        return subPart
                                            .split(/\r?\n/g)
                                            .map((line) => {
                                            if (!line)
                                                return '';
                                            // 转义特殊字符，但排除已经转义的 LaTeX 命令
                                            // 避免转义 LaTeX 命令中的反斜杠
                                            const escaped = line.replace(/([^\\])([{}%#&])/g, '$1\\$2'); // 只转义未被转义的特殊字符
                                            return line.trim() ? `\\text{${escaped}}` : '';
                                        })
                                            .join(' ');
                                    })
                                        .join('');
                                }
                            })
                                .join('');
                        }
                        else if (hasChinese) {
                            // 纯文本（含中文），整体包裹，并处理换行
                            latexToInsert = text
                                .split(/\r?\n/g)
                                .map((line) => {
                                const escaped = line.replace(/([\\{}])/g, '\\$1');
                                return `\\text{${escaped}}`;
                            })
                                .join(' ');
                        }
                        else {
                            // 其他情况（纯公式或英文），仅处理换行
                            latexToInsert = text.replace(/\r?\n/g, ' ');
                        }
                        // 自动修复不平衡的大括号
                        latexToInsert = fixLatex(latexToInsert);
                        mf.executeCommand(['insert', latexToInsert]);
                    }
                };
                mf.addEventListener('input', onInput);
                mf.addEventListener('paste', onPaste);
                cleanup = () => {
                    mf.removeEventListener('input', onInput);
                    mf.removeEventListener('paste', onPaste);
                };
            }
            else {
                // Retry if ref is not ready
                setTimeout(initListeners, 100);
            }
        };
        // Wait for custom element definition then init
        if (customElements.get('math-field')) {
            initListeners();
        }
        else {
            customElements.whenDefined('math-field').then(initListeners);
        }
        return () => {
            isMounted = false;
            if (cleanup)
                cleanup();
        };
    }, []);
    const onSelect = (latex) => {
        if (editMode === 'mathlive') {
            if (mfRef.current) {
                mfRef.current.focus();
                mfRef.current.executeCommand(['insert', latex]);
            }
        }
        else {
            setLatexVal(prev => prev + latex);
        }
    };
    const onLatexChange = (e) => {
        setLatexVal(e.target.value);
    };
    const renderPreview = (text) => {
        if (!text)
            return '';
        // 混合解析正则
        // 匹配 \[...\], $$...$$, \(...\), $...$
        const regex = /(\\\[[\s\S]*?\\\])|(\$\$[\s\S]*?\$\$)|(\\\([\s\S]*?\\\))|(\$[^$]+\$)/g;
        // 如果没有匹配到任何定界符
        if (!text.match(regex)) {
            // 尝试作为整体渲染（处理裸公式的情况）
            const seemsLikeLatex = text.includes('\\') || text.includes('$');
            if (seemsLikeLatex) {
                try {
                    return katex_1.default.renderToString(text, { throwOnError: true, strict: false, trust: true });
                }
                catch (e) {
                    // 如果整体渲染失败，可能只是包含 \ 的普通文本，或者是无法识别的公式
                    // 直接返回原文本（简单转义）
                    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                }
            }
            // 纯文本
            return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
        let lastIndex = 0;
        let result = '';
        let match = regex.exec(text);
        while (match !== null) {
            // 添加匹配之前的文本
            const textPart = text.slice(lastIndex, match.index);
            result += textPart.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const fullMatch = match[0];
            let formula = '';
            let displayMode = false;
            if (fullMatch.startsWith('\\[')) {
                formula = fullMatch.slice(2, -2);
                displayMode = true;
            }
            else if (fullMatch.startsWith('$$')) {
                formula = fullMatch.slice(2, -2);
                displayMode = true;
            }
            else if (fullMatch.startsWith('\\(')) {
                formula = fullMatch.slice(2, -2);
                displayMode = false;
            }
            else if (fullMatch.startsWith('$')) {
                formula = fullMatch.slice(1, -1);
                displayMode = false;
            }
            // 循环清理可能存在的嵌套定界符 (例如 $$ \(...\) $$)
            let clean = true;
            while (clean) {
                clean = false;
                formula = formula.trim();
                if (formula.startsWith('\\(') && formula.endsWith('\\)')) {
                    formula = formula.slice(2, -2);
                    clean = true;
                }
                else if (formula.startsWith('\\[') && formula.endsWith('\\]')) {
                    formula = formula.slice(2, -2);
                    clean = true;
                }
                else if (formula.startsWith('$$') && formula.endsWith('$$')) {
                    formula = formula.slice(2, -2);
                    clean = true;
                }
            }
            try {
                result += katex_1.default.renderToString(formula, {
                    throwOnError: false,
                    displayMode,
                    strict: false,
                    trust: true,
                });
            }
            catch (e) {
                result += `<span style="color: red;">${fullMatch}</span>`;
            }
            lastIndex = regex.lastIndex;
            match = regex.exec(text);
        }
        // 添加剩余的文本
        result += text.slice(lastIndex).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return result;
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "MathEditor", style: style, children: [(0, jsx_runtime_1.jsxs)("div", { className: "mathBody", children: [(0, jsx_runtime_1.jsx)("div", { className: "modeSegmented", children: (0, jsx_runtime_1.jsx)(antd_1.Segmented, { value: editMode, onChange: val => handleModeChange(val.toString()), options: [
                                { label: 'MathType 编辑', value: 'mathlive' },
                                { label: 'LaTex 编辑', value: 'latex' },
                            ] }) }), (0, jsx_runtime_1.jsx)("div", { className: "editContent", children: editMode === 'mathlive'
                            ? ((0, jsx_runtime_1.jsxs)("div", { className: "editKatax", children: [(0, jsx_runtime_1.jsx)("p", { className: "title", children: "\u516C\u5F0F\u7F16\u8F91\u533A\u57DF\uFF08\u652F\u6301\u76F4\u63A5\u7C98\u8D34\u516C\u5F0F\uFF09\uFF1A" }), (0, jsx_runtime_1.jsx)("math-field", { ref: mfRef, className: "mathField" })] }))
                            : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "editKatax", children: [(0, jsx_runtime_1.jsx)("p", { className: "title", children: "latex\u7F16\u8F91\u533A\u57DF\uFF1A\u6682\u4E0D\u652F\u6301\u4E2D\u6587\u5B57\u7B26\uFF0C\u8BF7\u4E0D\u8981\u8F93\u5165\u4E2D\u6587\u5B57\u7B26" }), (0, jsx_runtime_1.jsx)(antd_1.Input.TextArea, { value: latexVal, onChange: onLatexChange, style: { height: '75px' } })] }), (0, jsx_runtime_1.jsxs)("div", { className: "previewKatax", children: [(0, jsx_runtime_1.jsx)("p", { className: "previewTitle", children: "\u516C\u5F0F\u9884\u89C8\uFF1A" }), (0, jsx_runtime_1.jsx)("div", { dangerouslySetInnerHTML: {
                                                    __html: renderPreview(latexVal),
                                                } })] })] })) })] }), (0, jsx_runtime_1.jsx)(antd_1.Tabs, { activeKey: activeKey, onChange: setActiveKey, className: "mathTabs", popupClassName: "MathEditorMorePopup", items: const_1.KATEXLIST.map(i => ({
                    label: i.name,
                    key: i.name,
                    children: ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: i.children.map((c, idx) => ((0, jsx_runtime_1.jsx)("div", { className: "kataxBody", onClick: () => onSelect(c), dangerouslySetInnerHTML: {
                                __html: katex_1.default.renderToString(c),
                            } }, `${i.name}-${idx}`))) })),
                })) })] }));
};
exports.default = MathEditor;
