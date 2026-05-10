/* ==============================================
   乌托邦测试 — i18n 国际化系统
   ============================================== */

(function () {
    'use strict';

    const LOCALE = {
        zh: {
            siteTitle: '乌托邦测试 — Utopia Test',
            mainTitle: '乌托邦测试',
            subTitle: 'Utopia Test',
            intro1: '有的人认可宏大叙事...',  // Already hardcoded in HTML
            intro2: '在反乌托邦流行的当代...',
            scrollHint: '向下滑动，寻找你的乌托邦',
            resultTitle: '你的结果',
            dimLabels: {
                0: '社会分工程度',
                1: '社会阶级化程度',
                2: '内部竞争强度',
                3: '对科技态度'
            },
            poles: {
                left: ['独立', '平等', '和谐', '保守'],
                right: ['协作', '阶级', '竞争', '进步'],
            },
            toast: {
                needFlipAll: '请翻开「{name}」的全部卡片并选其一',
                scrollDown: '请向下滑动',
                noResult: '未能找到对应结果类型',
            },
            result: {
                seeResult: '是否查看结果？',
                yes: '是',
                no: '否',
                examples: '相似社会形态举例',
                compare: '维度对比',
                yourChoice: '你的选择',
                avgAll: '全体平均',
                avgAllWith: '全体平均 ({n}人)',
                saveImage: '保存结果图片',
                generating: '生成中...',
                saved: '结果图片已保存',
                saveFailed: '图片保存失败，请截图保存',
                ending: '每个人理想的社会形态都不尽相同...',
                hiddenHint: '元乌托邦概念...',
            }
        },
        en: {
            siteTitle: 'Utopia Test',
            mainTitle: 'Utopia Test',
            subTitle: 'What is your ideal society?',
            intro1: 'Some people embrace grand narratives, others reject them...',
            intro2: 'In an age of dystopian fiction...',
            scrollHint: 'Scroll down to find your utopia',
            resultTitle: 'Your Result',
            dimLabels: {
                0: 'Division of Labor',
                1: 'Social Stratification',
                2: 'Internal Competition',
                3: 'Attitude to Technology'
            },
            poles: {
                left: ['Independence', 'Equality', 'Harmony', 'Conservative'],
                right: ['Collaboration', 'Class', 'Competition', 'Progressive'],
            },
            toast: {
                needFlipAll: 'Please flip all cards in "{name}" and select one',
                scrollDown: 'Scroll down',
                noResult: 'Result type not found',
            },
            result: {
                seeResult: 'See your result?',
                yes: 'Yes',
                no: 'No',
                examples: 'Similar Societies',
                compare: 'Dimension Comparison',
                yourChoice: 'Your Choice',
                avgAll: 'Global Average',
                avgAllWith: 'Global Average ({n} people)',
                saveImage: 'Save as Image',
                generating: 'Generating...',
                saved: 'Image saved',
                saveFailed: 'Save failed, please screenshot',
                ending: 'Everyone has a different ideal society...',
                hiddenHint: 'Robert Nozick\'s meta-utopia concept...',
            }
        }
    };

    function detectLocale() {
        const lang = navigator.language || 'zh-CN';
        return lang.startsWith('zh') ? 'zh' : 'en';
    }

    let currentLocale = detectLocale();

    function t(path) {
        const keys = path.split('.');
        let val = LOCALE[currentLocale];
        for (const k of keys) {
            val = val && val[k];
        }
        return val || path;
    }

    function tf(path, replacements) {
        let text = t(path);
        if (replacements) {
            for (const [k, v] of Object.entries(replacements)) {
                text = text.replace(`{${k}}`, v);
            }
        }
        return text;
    }

    window._i18n = { t, tf, locale: currentLocale, LOCALE };
})();
