export interface SecureAssessmentQuestion {
  id: string;
  correctAnswer: string;
  explanation: string;
  concept: string;
}

export interface AssessmentAnswer {
  questionId: string;
  answer: string;
}

export interface GradedAssessmentAnswer {
  questionId: string;
  answer: string;
  correct: boolean;
  explanation: string;
  concept: string;
}

export function gradeAssessment(questions: SecureAssessmentQuestion[], answers: AssessmentAnswer[]) {
  const questionIds = new Set(questions.map((question) => question.id));
  const answerIds = answers.map((answer) => answer.questionId);
  if (questions.length === 0) throw new Error("Assessment has no questions.");
  if (new Set(answerIds).size !== answerIds.length) throw new Error("Duplicate question answers are not allowed.");
  if (questions.length !== answers.length || answers.some((answer) => !questionIds.has(answer.questionId))) throw new Error("Answers must include exactly every assessment question.");

  const answerByQuestion = new Map(answers.map((answer) => [answer.questionId, answer.answer]));
  const graded: GradedAssessmentAnswer[] = questions.map((question) => {
    const answer = answerByQuestion.get(question.id) ?? "";
    return { questionId: question.id, answer, correct: answer === question.correctAnswer, explanation: question.explanation, concept: question.concept };
  });
  const correctCount = graded.filter((item) => item.correct).length;
  return { graded, correctCount, totalCount: graded.length, score: correctCount / graded.length };
}
