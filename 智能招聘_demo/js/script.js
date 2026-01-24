// DOM Elements
const navLinks = document.querySelectorAll('.nav-links li');
const views = document.querySelectorAll('.view-section');
const modeRadios = document.querySelectorAll('input[name="jd-mode"]');
const modeContents = document.querySelectorAll('.mode-content');
const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const jdPreviewSection = document.getElementById('jd-preview-section');
const jdPreviewText = document.getElementById('jd-preview-text');
const modalOverlay = document.getElementById('modal-container');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');

// --- Navigation Logic ---
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        // Remove active class from all links
        navLinks.forEach(l => l.classList.remove('active'));
        // Add active to clicked
        link.classList.add('active');

        // Hide all views
        views.forEach(view => view.classList.remove('active'));
        // Show target view
        const targetId = link.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});

function navigateTo(targetId) {
    // Helper to navigate via buttons
    navLinks.forEach(l => {
        if (l.getAttribute('data-target') === targetId) {
            l.click();
        }
    });
}

// --- JD Generator Logic ---
modeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        const mode = e.target.value;
        modeContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`mode-${mode}-content`).classList.add('active');
    });
});

// Mode A: Chat
function handleChatInput(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Add user message
    addMessage(text, 'user-message');
    chatInput.value = '';

    // Simulate AI thinking and response
    setTimeout(() => {
        const response = "收到。基于您的描述，我已经了解了初步需求。我为您草拟了一份岗位描述，重点突出了高并发和系统设计能力。正在生成中...";
        addMessage(response, 'ai-message');

        setTimeout(() => {
            generateMockJD(text);
        }, 1000);
    }, 800);
}

function addMessage(text, className) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${className}`;

    let content = '';
    if (className === 'ai-message') {
        content = `<div class="message-avatar"><i class="fa-solid fa-robot"></i></div>
                   <div class="message-text">${text}</div>`;
    } else {
        content = `<div class="message-avatar"><i class="fa-solid fa-user"></i></div>
                   <div class="message-text">${text}</div>`;
    }

    msgDiv.innerHTML = content;
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Mode B: Structured
function enableTemplateButton() {
    document.getElementById('btn-template').disabled = false;
    document.getElementById('btn-template').classList.remove('disabled');
}

function fillTemplate() {
    const jobType = document.getElementById('job-type-select').value;
    const container = document.getElementById('structured-questions-container');
    container.innerHTML = ''; // Clear existing

    // Define questions based on job type (Simplified for demo, focusing on Backend/General)
    let questions = [];

    if (jobType === 'backend' || jobType === 'frontend' || jobType === 'design' || jobType === 'product' || jobType === 'sales') {
        // Generic "Engineer/Tech" template logic for demo purposes, customizing slightly
        const isDev = (jobType === 'backend' || jobType === 'frontend');

        questions = [
            {
                text: '1. 您希望候选人具备的核心专业技能是？(Core Skills)',
                options: isDev ? ['Java / Spring Boot', 'React / Vue.js', 'Python / Django', 'Go Lang', 'Node.js'] : ['市场分析', '用户调研', '交互设计 (Figma)', '数据分析 (SQL/Python)']
            },
            {
                text: '2. 期望候选人的经验年限范围？(Experience)',
                options: ['应届毕业生', '1-3年 (初级)', '3-5年 (中高级)', '5-8年 (资深/专家)', '8年以上']
            },
            {
                text: '3. 这个岗位在团队中的主要角色定位？(Role)',
                options: ['独立贡献者 (IC)', '团队导师/Tech Lead', '项目负责人', '实习生']
            },
            {
                text: '4. 业务领域或行业背景要求？(Domain)',
                options: ['电商/零售', '金融科技 (Fintech)', 'SaaS企业服务', '人工智能/大数据', '无特定行业要求']
            },
            {
                text: '5. 软技能或加分项？(Soft Skills & Bonus)',
                options: ['流利的英语沟通能力', '优秀的团队协作', '有创业公司经历', '抗压能力强']
            }
        ];
    } else {
        // Fallback
        questions = [
            { text: '1. 核心技能要求？', options: ['沟通能力', '文案写作', '逻辑思维'] },
            { text: '2. 经验要求？', options: ['1年以下', '1-3年', '3年以上'] }
        ];
    }

    // Render questions
    questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-item';

        const title = document.createElement('div');
        title.className = 'question-title';
        title.innerText = q.text;
        questionDiv.appendChild(title);

        const optionsGrid = document.createElement('div');
        optionsGrid.className = 'options-grid';

        q.options.forEach((opt, optIndex) => {
            const label = document.createElement('label');
            label.className = 'checkbox-item';
            // Auto check the first two for demo convenience
            const isChecked = optIndex === 0;
            label.innerHTML = `<input type="checkbox" name="q${index}_opt" value="${opt}" ${isChecked ? 'checked' : ''}> 
                               <span class="checkmark"></span> ${opt}`;
            optionsGrid.appendChild(label);
        });

        questionDiv.appendChild(optionsGrid);
        container.appendChild(questionDiv);
    });
}

function generateJDFromForm() {
    const jobTypeSelect = document.getElementById('job-type-select');
    const jobType = jobTypeSelect.value ? jobTypeSelect.options[jobTypeSelect.selectedIndex].text : "未指定岗位";

    // Gather answers
    const questionItems = document.querySelectorAll('.question-item');
    let requirements = [];

    questionItems.forEach(item => {
        const checked = item.querySelectorAll('input:checked');
        checked.forEach(cb => requirements.push(cb.value));
    });

    if (requirements.length === 0 && document.querySelectorAll('.question-item').length === 0) {
        alert('请先选择岗位类型并点击“智能填充模板”，或手动完善信息。');
        return;
    }

    let jdContent = `岗位名称：${jobType}\n\n`;
    jdContent += `【岗位职责】\n1. 负责核心业务模块的日常工作与交付；\n2. 参与团队建设与流程优化；\n3. 完成上级交代的其他任务。\n\n`;
    jdContent += `【任职要求】\n`;
    requirements.forEach((req, index) => {
        jdContent += `${index + 1}. ${req}；\n`;
    });
    const extraRemark = document.querySelector('textarea.form-control').value;
    if (extraRemark) {
        jdContent += `\n【补充说明】\n${extraRemark}\n`;
    }
    jdContent += `\n【我们提供】\n具有竞争力的薪酬、弹性工作制、顶尖的技术团队氛围。`;

    showJDPreview(jdContent);
}

function generateMockJD(prompt) {
    const mockJD = `基于您的要求生成的岗位描述：\n\n岗位名称：高级技术专家\n\n【岗位职责】\n1. 主导高并发系统的架构设计与核心代码实现；\n2. 解决现有系统在业务爆发增长下的性能瓶颈；\n3. 指导初中级工程师，提升团队技术氛围。\n\n【任职要求】\n1. 5年以上开发经验，精通Java/Go等语言；\n2. 深入理解分布式系统原理，有高并发实战经验；\n3. "${prompt}" 相关领域的深厚积累。`;
    showJDPreview(mockJD);
}

function showJDPreview(content) {
    jdPreviewText.innerText = content;
    jdPreviewSection.style.display = 'block';
    jdPreviewSection.scrollIntoView({ behavior: 'smooth' });
}

function regenerateJD() {
    jdPreviewText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> AI正在重新思考并优化措辞...';
    setTimeout(() => {
        jdPreviewText.innerText = `【优化版】\n` + jdPreviewText.innerText.replace('【优化版】\n', '').replace('AI正在重新思考并优化措辞...', '');
    }, 1500);
}

function publishJD() {
    alert('JD 已成功发布至招聘渠道！');
    navigateTo('candidate-screen');
}

// --- Candidate Screen Logic ---
function showReasonModal(title, reasonAnalysis, resumeSnippet) {
    modalTitle.innerText = title;

    let contentHtml = `
        <div class="modal-section-title"><i class="fa-solid fa-magnifying-glass-chart"></i> AI 匹配分析</div>
        <p>${reasonAnalysis}</p>
    `;

    if (resumeSnippet) {
        contentHtml += `
            <div class="modal-section-title"><i class="fa-regular fa-file-lines"></i> 简历原文引用</div>
            <div class="resume-snippet-box">
                ${resumeSnippet.replace(/\n/g, '<br>')}
            </div>
        `;
    }

    modalBody.innerHTML = contentHtml;
    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

// Close modal when clicking outside
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

function goToInterview() {
    const checked = document.querySelectorAll('.interview-checkbox:checked');
    if (checked.length === 0) {
        alert('请至少选择一位候选人进入面试环节。');
        return;
    }
    navigateTo('interview-process');
}

// --- Interview Process Logic ---
function switchEmailTab(type) {
    const tabs = document.querySelectorAll('.tab-btn');
    const textarea = document.getElementById('email-template-area');

    tabs.forEach(t => t.classList.remove('active'));
    // Simple toggle logic based on text content or passing 'this' would be better 
    // but looking at function args:
    if (type === 'invite') {
        tabs[0].classList.add('active');
        textarea.value = `尊敬的 {候选人姓名}：\n\n恭喜您！我们非常高兴地通知您，您已通过我们的初步筛选。您的经历与 {岗位名称} 的要求非常契合。\n\n我们诚挚地邀请您参加下一轮技术面试。请查看附件中的面试安排建议，并告知我们您方便的时间。\n\n期待与您的交流！\n人才招聘组`;
    } else {
        tabs[1].classList.add('active');
        textarea.value = `尊敬的 {候选人姓名}：\n\n感谢您投递 {岗位名称} 职位。经过仔细评估，我们认为您目前的经历与我们该岗位的需求暂时不是很匹配。\n\n您的简历已进入我们的人才库，未来有合适的岗位我们会第一时间联系您。\n\n祝您求职顺利！\n人才招聘组`;
    }
}

function sendEmails() {
    const btn = document.querySelector('.panel-footer .btn-primary');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 发送中...`;

    setTimeout(() => {
        btn.innerHTML = `<i class="fa-solid fa-check"></i> 发送成功`;
        btn.style.background = 'var(--success-color)';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = ''; // Reset to css default
        }, 2000);
    }, 1500);
}

function toggleAccordion(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('i');

    if (content.style.display === 'block') {
        content.style.display = 'none';
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    } else {
        content.style.display = 'block';
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    }
}
