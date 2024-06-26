import { Message } from 'whatsapp-web.js';
import { middleware } from '../../middleware/middleware';
import { prompts } from 'src/openai/prompts';
import { openaiCompletionsCreate } from 'src/openai/openaiCompletionsCreate';
import { messageParseToGpt } from 'src/group/message/messageParseToGpt';

const resumeMessageQty = async (msg: Message) => {
  const qty = msg.body.replace('!resume-qty', '').trim();

  if (!qty) {
    return msg.reply('Usage: !resume-qty <qty>');
  }

  if (Number(qty) <= 0 || Number(qty) > 300) {
    return msg.reply('Number of messages exceeds the limit (0 - 300).');
  }

  const chat = await msg.getChat();

  const isDevelopment = process.env.NODE_ENV === 'development';

  const messages = await chat.fetchMessages({
    limit: Number(qty) + 1,
    fromMe: isDevelopment ? undefined : false,
  });
  if (!messages.length) {
    return msg.reply('No messages to resume');
  }

  const parsedMessages = messageParseToGpt(
    messages.map((msg) => ({
      sender: msg._data.notifyName,
      message: msg.body,
    })),
  );

  if (!parsedMessages.length) {
    return msg.reply('No messages to resume');
  }

  const text = `${prompts.resume('ptbr')} \n ${parsedMessages}`;

  const response = await openaiCompletionsCreate({
    payload: {
      text,
      context: '',
    },
  });

  if (!response) {
    return msg.reply('No messages to resume');
  }

  msg.reply(`Resuming messages:\n\n${response}`);
};

export default middleware(resumeMessageQty);
