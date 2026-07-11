import type { PublicUuid } from '@/types/exam';

function virtualTrueFalseText(answerUuid: string): 'True' | 'False' | null {
  if (answerUuid.startsWith('virtual-true-')) return 'True';
  if (answerUuid.startsWith('virtual-false-')) return 'False';
  return null;
}

export function buildAnswersPayload(
  selectedAnswers: Record<string, string>,
  textInputAnswers: Record<string, string>
) {
  const answers: Array<{
    question_uuid: PublicUuid;
    answer_uuid?: PublicUuid;
    answer_text?: string;
  }> = [];

  for (const [questionUuid, textValue] of Object.entries(textInputAnswers)) {
    if (!textValue?.trim()) continue;
    answers.push({
      question_uuid: questionUuid,
      answer_text: textValue.trim(),
    });
  }

  for (const [questionUuid, answerUuid] of Object.entries(selectedAnswers)) {
    if (!answerUuid) continue;

    const virtualText = virtualTrueFalseText(answerUuid);
    if (virtualText) {
      answers.push({
        question_uuid: questionUuid,
        answer_text: virtualText,
      });
      continue;
    }

    answers.push({
      question_uuid: questionUuid,
      answer_uuid: answerUuid,
    });
  }

  return answers;
}

export function getTrueFalseOptionIds(questionUuid: PublicUuid, answers?: Array<{ uuid: PublicUuid; answer_text: string }>) {
  const trueAnswer = answers?.find((answer) => {
    const text = answer.answer_text.toLowerCase().trim();
    return text === 'true' || text === '1' || text === 'yes';
  }) ?? answers?.find((answer, index) => index === 0 && answer.answer_text.toLowerCase().includes('true'));

  const falseAnswer = answers?.find((answer) => {
    const text = answer.answer_text.toLowerCase().trim();
    return text === 'false' || text === '0' || text === 'no';
  }) ?? answers?.find((answer, index) => index === 1 && answer.answer_text.toLowerCase().includes('false'));

  return {
    trueId: trueAnswer?.uuid ?? `virtual-true-${questionUuid}`,
    falseId: falseAnswer?.uuid ?? `virtual-false-${questionUuid}`,
  };
}
