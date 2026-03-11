const LABEL_REPLACEMENTS: Array<[RegExp, string]> = [
	[/\bRole:\s*/g, '岗位方向：'],
	[/\bHard_Skills:\s*/g, '核心技能：'],
	[/\bSoft_Skills:\s*/g, '软技能：'],
	[/\bExp_Years:\s*/g, '工作年限：'],
	[/\bEducation:\s*/g, '学历：'],
	[/\bWork Experience:\s*/gi, '工作经历：'],
	[/\bProjects:\s*/gi, '项目经历：'],
];

function normalizeCommaSeparatedValues(value: string): string {
	return value
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean)
		.join('、');
}

export function prettifyResumeSnippet(text: string | undefined | null): string {
	if (!text) return '暂无';

	let next = text
		.replace(/\r\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();

	for (const [pattern, replacement] of LABEL_REPLACEMENTS) {
		next = next.replace(pattern, replacement);
	}

	next = next.replace(/核心技能：([^\n]+)/g, (_, skills) => `核心技能：${normalizeCommaSeparatedValues(skills)}`);
	next = next.replace(/软技能：([^\n]+)/g, (_, skills) => `软技能：${normalizeCommaSeparatedValues(skills)}`);
	next = next.replace(/工作年限：([^\n]+)/g, (_, years) => {
		const normalized = years.replace(/[^\d]/g, '');
		return normalized ? `工作年限：${normalized} 年` : '工作年限：未注明';
	});

	return next.replace(/:\s*(未注明|N\/A)/g, '：$1');
}
