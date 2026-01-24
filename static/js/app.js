// Recruitment Copilot Frontend Logic

const state = {
	currentStep: 1,
	questions: [],
	answers: {},
	jd: null,
	resumes: []
};

document.addEventListener('DOMContentLoaded', () => {
	// DOM Elements
	const btnStartClarify = document.getElementById('btn-start-clarify');
	const btnGenerateJd = document.getElementById('btn-generate-jd');
	const btnConfirmJd = document.getElementById('btn-confirm-jd');
	const btnFakeData = document.getElementById('btn-fake-data');
	const btnAnalyze = document.getElementById('btn-analyze');

	// Event Listeners
	// Event Listeners
	btnStartClarify.addEventListener('click', handleClarify);

	// Clarify Buttons
	btnGenerateJd.addEventListener('click', handleGenerateJd);
	document.getElementById('btn-retry-clarify')?.addEventListener('click', handleClarify);

	// JD Buttons
	btnConfirmJd.addEventListener('click', () => switchStep(3));
	document.getElementById('btn-retry-jd')?.addEventListener('click', handleGenerateJd);

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

// Step 1 -> 1.5
async function handleClarify() {
	const rawReq = document.getElementById('initial-req').value;
	if (!rawReq) return alert('请先输入简要需求');

	const loader = document.getElementById('loading-clarify');
	const btn = document.getElementById('btn-start-clarify');

	loader.classList.remove('hidden');
	btn.disabled = true;

	try {
		const res = await fetch('/api/clarify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ raw_requirement: rawReq })
		});
		const data = await res.json();

		renderQuestions(data.questions);
		switchStep(1.5);
	} catch (e) {
		alert('请求失败，请检查后端');
		console.error(e);
	} finally {
		loader.classList.add('hidden');
		btn.disabled = false;
	}
}

function renderQuestions(questions) {
	state.questions = questions;
	const container = document.getElementById('clarification-container');
	container.innerHTML = '';

	questions.forEach(q => {
		const card = document.createElement('div');
		card.className = 'chat-q-card';

		let html = `<span class="q-title">${q.question}</span>`;

		if (q.options && q.options.length > 0) {
			html += `<div class="q-options">`;
			q.options.forEach(opt => {
				html += `<div class="option-pill" onclick="selectOption(this, '${q.id}', '${opt}')">${opt}</div>`;
			});
			html += `</div>`;
			// Hidden input for custom value or selected value
			html += `<input type="text" class="q-input hidden" id="input-${q.id}" placeholder="补充说明...">`;
		} else {
			html += `<input type="text" class="q-input" id="input-${q.id}" placeholder="请输入回答" onchange="inputAnswer('${q.id}', this.value)">`;
		}

		card.innerHTML = html;
		container.appendChild(card);
	});
}

window.selectOption = (el, qId, val) => {
	// Visual selection
	const siblings = el.parentElement.querySelectorAll('.option-pill');
	siblings.forEach(s => s.classList.remove('selected'));
	el.classList.add('selected');

	// Check if "specify" or "fill" is in the text
	const isSpecify = val.includes("填写") || val.includes("其他");
	const inputEl = document.getElementById(`input-${qId}`);

	if (isSpecify) {
		inputEl.classList.remove('hidden');
		inputEl.focus();
		state.answers[qId] = ""; // Wait for input

		// Add listener to update state on input
		inputEl.oninput = (e) => {
			state.answers[qId] = e.target.value;
		};
	} else {
		if (inputEl) inputEl.classList.add('hidden');
		// Record answer
		state.answers[qId] = val;
	}
};

window.inputAnswer = (qId, val) => {
	state.answers[qId] = val;
};

// Step 1.5 -> 2
async function handleGenerateJd() {
	// Collect all answers
	const payload = [];
	state.questions.forEach(q => {
		// If query selector input is visible and has value, use it, else use state (from pills) or empty
		const val = state.answers[q.id] || "无";
		payload.push({ question_id: q.id, answer: val });
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
        <div class="jd-field"><h2>${jd.title} <span style="font-size:0.6em; color:#888;">(${jd.work_location})</span></h2></div>
        <div class="jd-field">
            <h3>薪资待遇</h3>
            <p style="color: var(--success); font-weight: bold; font-size: 1.2rem;">
                ${jd.salary.range} 
                <span style="font-size:0.8rem; color:#888;">(${jd.salary.tax_type}${jd.salary.has_bonus ? ' + 绩效' : ''})</span>
            </p>
            ${jd.salary.description ? `<p style="font-size:0.9rem; color:#aaa;">${jd.salary.description}</p>` : ''}
        </div>
        <div class="jd-field">
            <h3>经验要求</h3>
            <p>${jd.experience_level}</p>
        </div>
        <div class="jd-field">
            <h3>核心职责</h3>
            <ul style="padding-left: 20px;">
                ${jd.key_responsibilities.map(r => `<li>${r.replace(/^[\s•\-\*]+/, '')}</li>`).join('')}
            </ul>
        </div>
        <div class="jd-field">
            <h3>必备技能</h3>
            <div class="tags">${jd.required_skills.map(s => `<span class="tag">${s}</span>`).join('')}</div>
        </div>
    `;
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
	body.innerText = "AI 正在生成内容...";
	title.innerText = type === 'offer' ? '生成 Offer' : (type === 'interview' ? '面试邀请' : '拒信草稿');

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
		body.innerText = data.content;
	} catch (e) {
		body.innerText = "生成失败，请重试";
	}
};
