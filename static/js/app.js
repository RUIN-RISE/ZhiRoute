// Recruitment Copilot Frontend Logic

const state = {
	currentStep: 1,
	questions: [],
	answers: {},
	jd: null,
	resumes: [],
	chatHistory: [],
	collectedInfo: {},
	isComplete: false
};

document.addEventListener('DOMContentLoaded', () => {
	// DOM Elements
	const btnStartClarify = document.getElementById('btn-start-clarify');
	const btnGenerateJd = document.getElementById('btn-generate-jd');
	const btnConfirmJd = document.getElementById('btn-confirm-jd');
	const btnFakeData = document.getElementById('btn-fake-data');
	const btnAnalyze = document.getElementById('btn-analyze');

	// Event Listeners
	btnStartClarify.addEventListener('click', startChat);

	// Chat controls
	document.getElementById('btn-send-chat')?.addEventListener('click', sendChatMessage);
	document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
		if (e.key === 'Enter') sendChatMessage();
	});
	document.getElementById('btn-restart-chat')?.addEventListener('click', restartChat);

	// JD Buttons
	btnGenerateJd.addEventListener('click', handleGenerateJdFromChat);
	btnConfirmJd.addEventListener('click', () => {
		saveJdEdits();
		switchStep(3);
	});
	document.getElementById('btn-retry-jd')?.addEventListener('click', handleGenerateJdFromChat);

	const fileInput = document.getElementById('file-upload-input');
	if (fileInput) {
		fileInput.addEventListener('change', (e) => handleUpload(e.target.files));
	}

	// Analyze Buttons
	btnAnalyze.addEventListener('click', handleAnalyze);
	document.getElementById('btn-retry-analyze')?.addEventListener('click', handleAnalyze);

	// Modal Close
	document.querySelector('.close-modal').onclick = () => {
		document.getElementById('action-modal').classList.add('hidden');
	};

	// Copy Content Button
	document.querySelector('.copy-btn')?.addEventListener('click', () => {
		const modalBody = document.getElementById('modal-body');
		const emailContent = modalBody.querySelector('.email-content');
		if (emailContent) {
			const text = emailContent.innerText;
			navigator.clipboard.writeText(text).then(() => {
				alert('邮件内容已复制到剪贴板！');
			}).catch(err => {
				console.error('Copy failed:', err);
			});
		} else {
			navigator.clipboard.writeText(modalBody.innerText).then(() => {
				alert('内容已复制到剪贴板！');
			});
		}
	});
});

function switchStep(step) {
	// Hide all steps
	document.querySelectorAll('.step-section').forEach(el => el.classList.add('hidden'));

	// Show current step or intermediate steps
	if (step === 1) document.getElementById('step-1').classList.remove('hidden');
	if (step === 1.5) document.getElementById('step-clarify').classList.remove('hidden');
	if (step === 2) document.getElementById('step-2').classList.remove('hidden');
	if (step === 3) document.getElementById('step-3').classList.remove('hidden');
	if (step === 4) document.getElementById('step-4').classList.remove('hidden');

	// Update Sidebar
	document.querySelectorAll('.nav-item').forEach(el => {
		const itemStep = parseInt(el.dataset.step);
		el.classList.remove('active');
		if (itemStep === Math.floor(step)) el.classList.add('active');
		if (itemStep < step) el.classList.remove('disabled');
	});

	state.currentStep = step;
}

// ========== CHAT FUNCTIONS FOR MULTI-TURN DIALOGUE ==========

// Start chat conversation
async function startChat() {
	const rawReq = document.getElementById('initial-req').value;

	const loader = document.getElementById('loading-clarify');
	const btn = document.getElementById('btn-start-clarify');

	loader.classList.remove('hidden');
	btn.disabled = true;

	// Reset chat state
	state.chatHistory = [];
	state.collectedInfo = {};
	state.isComplete = false;

	// Reset backend chat
	await fetch('/api/reset_chat', { method: 'POST' });

	// Clear chat container
	document.getElementById('chat-container').innerHTML = '';
	document.getElementById('quick-replies').innerHTML = '';
	document.getElementById('btn-generate-jd').classList.add('hidden');

	try {
		// Send initial message (or empty to start)
		const res = await fetch('/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message: rawReq || '', history: [] })
		});
		const data = await res.json();

		// Add user message if any
		if (rawReq) {
			state.chatHistory.push({ role: 'user', content: rawReq });
			renderChatMessage('user', rawReq);
		}

		// Add AI response
		state.chatHistory.push({ role: 'assistant', content: data.reply });
		renderChatMessage('ai', data.reply);
		renderQuickReplies(data.quick_replies || []);

		// Update collected info
		if (data.collected_info) {
			state.collectedInfo = { ...state.collectedInfo, ...data.collected_info };
		}

		// Check if complete
		if (data.is_complete) {
			state.isComplete = true;
			document.getElementById('btn-generate-jd').classList.remove('hidden');
		}

		switchStep(1.5);
	} catch (e) {
		alert('请求失败，请检查后端');
		console.error(e);
	} finally {
		loader.classList.add('hidden');
		btn.disabled = false;
	}
}

// Send chat message
async function sendChatMessage() {
	const input = document.getElementById('chat-input');
	const message = input.value.trim();
	if (!message) return;

	input.value = '';
	input.disabled = true;
	document.getElementById('btn-send-chat').disabled = true;

	// Show user message
	state.chatHistory.push({ role: 'user', content: message });
	renderChatMessage('user', message);

	// Clear quick replies
	document.getElementById('quick-replies').innerHTML = '';

	try {
		const res = await fetch('/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message, history: [] })
		});
		const data = await res.json();

		// Add AI response
		state.chatHistory.push({ role: 'assistant', content: data.reply });
		renderChatMessage('ai', data.reply);
		renderQuickReplies(data.quick_replies || []);

		// Update collected info
		if (data.collected_info) {
			state.collectedInfo = { ...state.collectedInfo, ...data.collected_info };
		}

		// Check if complete
		if (data.is_complete) {
			state.isComplete = true;
			document.getElementById('btn-generate-jd').classList.remove('hidden');
		}
	} catch (e) {
		renderChatMessage('ai', '抱歉，发生了错误，请重试。');
		console.error(e);
	} finally {
		input.disabled = false;
		document.getElementById('btn-send-chat').disabled = false;
		input.focus();
	}
}

// Restart chat
async function restartChat() {
	if (!confirm('确定要重新开始对话吗？')) return;

	state.chatHistory = [];
	state.collectedInfo = {};
	state.isComplete = false;

	await fetch('/api/reset_chat', { method: 'POST' });

	document.getElementById('chat-container').innerHTML = '';
	document.getElementById('quick-replies').innerHTML = '';
	document.getElementById('btn-generate-jd').classList.add('hidden');

	// Start new chat with welcome message
	try {
		const res = await fetch('/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message: '', history: [] })
		});
		const data = await res.json();

		state.chatHistory.push({ role: 'assistant', content: data.reply });
		renderChatMessage('ai', data.reply);
		renderQuickReplies(data.quick_replies || []);
	} catch (e) {
		console.error(e);
	}
}

// Render a single chat message
function renderChatMessage(role, content) {
	const container = document.getElementById('chat-container');
	const msgDiv = document.createElement('div');
	msgDiv.className = `chat-message ${role}`;
	msgDiv.textContent = content;
	container.appendChild(msgDiv);
	container.scrollTop = container.scrollHeight;
}

// Render quick reply buttons
function renderQuickReplies(replies) {
	const container = document.getElementById('quick-replies');
	container.innerHTML = '';

	replies.forEach(reply => {
		const btn = document.createElement('button');
		btn.className = 'quick-reply-btn';
		btn.textContent = reply;
		btn.onclick = () => {
			document.getElementById('chat-input').value = reply;
			sendChatMessage();
		};
		container.appendChild(btn);
	});
}

// Generate JD from collected chat info
async function handleGenerateJdFromChat() {
	const loader = document.getElementById('loading-jd');
	loader.classList.remove('hidden');

	// Convert collected info to answers format
	const answers = [];
	const info = state.collectedInfo;

	if (info.role) answers.push({ question_id: 'role', answer: info.role });
	if (info.core_skills) answers.push({ question_id: 'skills', answer: info.core_skills.join(', ') });
	if (info.exp_years) answers.push({ question_id: 'exp', answer: info.exp_years });
	if (info.soft_skills) answers.push({ question_id: 'soft', answer: info.soft_skills.join(', ') });
	if (info.bonus) answers.push({ question_id: 'bonus', answer: info.bonus.join(', ') });

	// Build raw requirement from chat
	const rawReq = state.chatHistory
		.filter(m => m.role === 'user')
		.map(m => m.content)
		.join('; ');

	try {
		const res = await fetch('/api/generate_jd', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ answers, raw_req: rawReq || '招聘职位' })
		});
		const jd = await res.json();

		state.jd = jd;
		renderJd(jd);
		switchStep(2);
	} catch (e) {
		alert('生成 JD 失败');
		console.error(e);
	} finally {
		loader.classList.add('hidden');
	}
}

// Legacy handleClarify for backward compatibility
async function handleClarify() {
	startChat();
}

function renderQuestions(questions) {
	state.questions = questions;
	state.answers = {}; // Reset answers
	const container = document.getElementById('clarification-container');
	container.innerHTML = '';

	questions.forEach(q => {
		const card = document.createElement('div');
		card.className = 'chat-q-card';

		const isMulti = q.multi_select === true;
		// Note: Don't add (可多选) here - LLM already includes it in question text

		let html = `<span class="q-title">${q.question}</span>`;

		if (q.options && q.options.length > 0) {
			html += `<div class="q-options" data-multi="${isMulti}" data-qid="${q.id}">`;
			q.options.forEach((opt, idx) => {
				const optText = typeof opt === 'string' ? opt : opt.text;
				const needsInput = typeof opt === 'object' && opt.requires_input === true;
				const inputType = isMulti ? 'checkbox' : 'radio';

				html += `
					<label class="option-item" style="display: flex; align-items: center; margin: 5px 0; cursor: pointer;">
						<input type="${inputType}" name="q_${q.id}" value="${optText}" 
							data-needs-input="${needsInput}" 
							onchange="handleOptionChange('${q.id}', '${optText}', ${needsInput}, this)"
							style="margin-right: 8px;">
						<span class="option-text">${optText}</span>
					</label>
					<input type="text" class="q-input-inline hidden" id="input-${q.id}-${idx}" 
						placeholder="请补充说明..." 
						data-qid="${q.id}" data-opt="${optText}"
						oninput="updateInputValue('${q.id}', '${optText}', this.value)"
						style="margin: 0 0 5px 25px; width: calc(100% - 30px);">
				`;
			});
			html += `</div>`;
		} else {
			html += `<input type="text" class="q-input" id="input-${q.id}" placeholder="请输入回答" onchange="inputAnswer('${q.id}', this.value)">`;
		}

		card.innerHTML = html;
		container.appendChild(card);
	});
}

// Handle option selection (checkbox/radio)
window.handleOptionChange = (qId, optText, needsInput, inputEl) => {
	const checked = inputEl.checked;
	const idx = Array.from(inputEl.closest('.q-options').querySelectorAll('input[type="checkbox"], input[type="radio"]')).indexOf(inputEl);
	const inputField = document.getElementById(`input-${qId}-${idx}`);

	// Initialize answer array for multi-select
	if (!state.answers[qId]) {
		state.answers[qId] = [];
	}

	// If it's radio button, reset to single value
	const isMulti = inputEl.type === 'checkbox';

	if (!isMulti) {
		// Radio: single selection
		state.answers[qId] = checked ? optText : '';
		// Hide all inputs for this question
		document.querySelectorAll(`input[data-qid="${qId}"].q-input-inline`).forEach(inp => inp.classList.add('hidden'));
	} else {
		// Checkbox: array of selections
		if (checked) {
			if (!state.answers[qId].includes(optText)) {
				state.answers[qId].push(optText);
			}
		} else {
			state.answers[qId] = state.answers[qId].filter(v => v !== optText);
		}
	}

	// Show/hide input field
	if (inputField) {
		if (checked && needsInput) {
			inputField.classList.remove('hidden');
			inputField.focus();
		} else {
			inputField.classList.add('hidden');
		}
	}
};

// Update extra input value
window.updateInputValue = (qId, optText, value) => {
	// Store extra input with format "Option: value"
	const key = `${qId}_extra`;
	if (!state.answers[key]) state.answers[key] = {};
	state.answers[key][optText] = value;
};

window.inputAnswer = (qId, val) => {
	state.answers[qId] = val;
};

// Step 1.5 -> 2
async function handleGenerateJd() {
	// Collect all answers
	const payload = [];
	state.questions.forEach(q => {
		let val = state.answers[q.id];
		// Convert array to comma-separated string
		if (Array.isArray(val)) {
			val = val.join(', ');
		}
		// Add extra input values if any
		const extraKey = `${q.id}_extra`;
		if (state.answers[extraKey]) {
			const extras = Object.entries(state.answers[extraKey])
				.filter(([k, v]) => v)
				.map(([k, v]) => `${k}: ${v}`);
			if (extras.length) {
				val = val ? `${val}, ${extras.join(', ')}` : extras.join(', ');
			}
		}
		payload.push({ question_id: q.id, answer: val || "无" });
	});

	const rawReq = document.getElementById('initial-req').value;

	const loader = document.getElementById('loading-jd');
	loader.classList.remove('hidden');

	try {
		const res = await fetch('/api/generate_jd', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				answers: payload,
				raw_req: rawReq
			})
		});
		const jd = await res.json();
		renderJd(jd);
		switchStep(2);
	} catch (e) {
		console.error(e);
	} finally {
		loader.classList.add('hidden');
	}
}

function renderJd(jd) {
	state.jd = jd;
	const container = document.getElementById('jd-display');
	container.innerHTML = `
        <div class="jd-field">
            <label style="color:#888; font-size:0.8rem;">职位名称</label>
            <input type="text" id="jd-title" value="${jd.title}" class="jd-edit-input" 
                style="font-size:1.5rem; font-weight:bold; width:100%;">
        </div>
        <div class="jd-field">
            <label style="color:#888; font-size:0.8rem;">薪资范围</label>
            <div style="display: flex; gap: 10px; align-items: center;">
                <input type="text" id="jd-salary-range" value="${jd.salary.range}" class="jd-edit-input" style="flex:1;">
                <select id="jd-salary-tax" class="jd-edit-input">
                    <option value="税前" ${jd.salary.tax_type === '税前' ? 'selected' : ''}>税前</option>
                    <option value="税后" ${jd.salary.tax_type === '税后' ? 'selected' : ''}>税后</option>
                </select>
                <label style="color:#888;"><input type="checkbox" id="jd-salary-bonus" ${jd.salary.has_bonus ? 'checked' : ''}> 含绩效</label>
            </div>
        </div>
        <div class="jd-field">
            <label style="color:#888; font-size:0.8rem;">经验要求</label>
            <input type="text" id="jd-experience" value="${jd.experience_level}" class="jd-edit-input">
        </div>
        <div class="jd-field">
            <label style="color:#888; font-size:0.8rem;">核心职责（每行一条）</label>
            <textarea id="jd-responsibilities" class="jd-edit-textarea" rows="4">${jd.key_responsibilities.join('\n')}</textarea>
        </div>
        <div class="jd-field">
            <label style="color:#888; font-size:0.8rem;">必备技能（逗号分隔）</label>
            <input type="text" id="jd-skills" value="${jd.required_skills.join(', ')}" class="jd-edit-input">
        </div>
    `;
}

// Save JD edits before confirmation
function saveJdEdits() {
	state.jd.title = document.getElementById('jd-title').value;
	state.jd.salary.range = document.getElementById('jd-salary-range').value;
	state.jd.salary.tax_type = document.getElementById('jd-salary-tax').value;
	state.jd.salary.has_bonus = document.getElementById('jd-salary-bonus').checked;
	state.jd.experience_level = document.getElementById('jd-experience').value;
	state.jd.key_responsibilities = document.getElementById('jd-responsibilities').value.split('\n').filter(s => s.trim());
	state.jd.required_skills = document.getElementById('jd-skills').value.split(',').map(s => s.trim()).filter(s => s);
}

// Step 3
async function handleFakeData() {
	// Keep for fallback testing
	try {
		const res = await fetch('/api/generate_fake_resumes');
		const resumes = await res.json();
		renderResumes(resumes);
	} catch (e) {
		console.error(e);
	}
}

async function handleUpload(files) {
	if (!files.length) return;
	const file = files[0];

	const formData = new FormData();
	formData.append('file', file);

	const loader = document.getElementById('loading-upload');
	if (loader) loader.classList.remove('hidden');

	try {
		const res = await fetch('/api/upload_resumes', {
			method: 'POST',
			body: formData
		});
		const resumes = await res.json();
		renderResumes(resumes);
	} catch (e) {
		alert('Upload failed');
		console.error(e);
	} finally {
		if (loader) loader.classList.add('hidden');
	}
}

function renderResumes(resumes) {
	state.resumes = resumes;
	const list = document.getElementById('resume-items');
	list.innerHTML = '';
	resumes.forEach(r => {
		const li = document.createElement('li');
		li.textContent = `${r.name}`;
		list.appendChild(li);
	});

	document.getElementById('resume-list').classList.remove('hidden');
	document.getElementById('btn-analyze').classList.remove('hidden');
}

// Step 3 -> 4
async function handleAnalyze() {
	const loader = document.getElementById('loading-analysis');
	loader.classList.remove('hidden');

	try {
		const res = await fetch('/api/analyze_resumes', { method: 'POST' });
		const ranks = await res.json();
		renderRanking(ranks);
		switchStep(4);
	} catch (e) {
		console.error(e);
	} finally {
		loader.classList.add('hidden');
	}
}

function renderRanking(ranks) {
	const container = document.getElementById('ranking-container');
	container.innerHTML = '';

	ranks.forEach((candidate, index) => {
		const div = document.createElement('div');
		div.className = 'candidate-card';
		div.innerHTML = `
            <div class="card-header">
                <div style="display:flex; align-items:center;">
                    <div class="rank-badge">#${index + 1}</div>
                    <h3>${candidate.name}</h3>
                </div>
                <div>
                    <span class="score">${candidate.score}</span>
                    <span class="score-label">匹配分</span>
                </div>
            </div>
            <div class="card-body">
                <p>${candidate.summary}</p>
                ${candidate.evidence_quotes && candidate.evidence_quotes.length > 0 ? `
                    <div class="resume-quotes" style="margin: 10px 0; padding: 10px; background: rgba(59, 130, 246, 0.1); border-left: 3px solid var(--primary); border-radius: 4px;">
                        <div style="font-size: 0.85rem; color: #888; margin-bottom: 5px;">📄 简历原文引用:</div>
                        ${candidate.evidence_quotes.map(q => `<blockquote style="margin: 5px 0; font-style: italic; color: #ccc;">"${q}"</blockquote>`).join('')}
                    </div>
                ` : ''}
                <div class="evidence-list">
                    ${candidate.top_evidence.map(e => `
                        <div class="evidence-item">
                            <span class="evidence-quote">"${e.quote}"</span>
                            <div class="evidence-reason">${e.reasoning}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="card-actions">
                <button class="btn-offer" onclick="generateAction('${candidate.name}', 'offer')">生成 Offer</button>
                <button class="btn-interview" onclick="generateAction('${candidate.name}', 'interview')">生成面试邀约</button>
                <button class="btn-reject" onclick="generateAction('${candidate.name}', 'reject')">生成拒信</button>
            </div>
        `;
		container.appendChild(div);
	});
}

window.generateAction = async (name, type) => {
	const modal = document.getElementById('action-modal');
	const body = document.getElementById('modal-body');
	const title = document.getElementById('modal-title');

	modal.classList.remove('hidden');
	body.innerHTML = "AI 正在生成内容...";
	title.innerText = type === 'offer' ? '生成 Offer' : (type === 'interview' ? '面试邀请 + 面试题目' : '拒信草稿');

	try {
		const res = await fetch('/api/generate_action', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				candidate_name: name,
				action_type: type,
				job_title: state.jd.title
			})
		});
		const data = await res.json();

		let html = `<div class="email-content">${data.content.replace(/\n/g, '<br>')}</div>`;

		// Show interview questions if available
		if (data.interview_questions && data.interview_questions.length > 0) {
			html += `
				<div class="interview-questions" style="margin-top: 20px; padding: 15px; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
					<h4 style="margin: 0 0 10px 0; color: var(--primary);">📝 面试题目 <button onclick="copyQuestions()" class="btn-secondary" style="font-size: 0.8rem; padding: 3px 8px; margin-left: 10px;">复制题目</button></h4>
					<ol id="questions-list" style="padding-left: 20px; margin: 0;">
						${data.interview_questions.map(q => `<li style="margin: 8px 0;">${q}</li>`).join('')}
					</ol>
				</div>
			`;
		}

		body.innerHTML = html;
	} catch (e) {
		body.innerText = "生成失败，请重试";
	}
};

// Copy interview questions to clipboard
window.copyQuestions = () => {
	const questionsList = document.getElementById('questions-list');
	if (questionsList) {
		const questions = Array.from(questionsList.querySelectorAll('li')).map((li, i) => `${i + 1}. ${li.textContent}`).join('\n');
		navigator.clipboard.writeText(questions).then(() => {
			alert('面试题目已复制到剪贴板！');
		}).catch(err => {
			console.error('Copy failed:', err);
		});
	}
};
