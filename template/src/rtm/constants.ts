/** ***** EVENTS ACTIONS BEGINS***** */
//  1. RECORDING
const RECORDING_STARTED = 'RECORDING_STARTED';
const RECORDING_STOPPED = 'RECORDING_STOPPED';

const EventActions = {
  RECORDING_STARTED,
  RECORDING_STOPPED,
};

/** ***** EVENTS  ACTIONS ENDS ***** */

/** ***** EVENT NAMES BEGINS ***** */
// 1. RECORDING
const RECORDING_ATTRIBUTE = 'recording';
// 2. LIVE STREAMING
const RAISED_ATTRIBUTE = 'raised';
const ROLE_ATTRIBUTE = 'role';
// 3. CHAT MESSAGES
const PUBLIC_CHAT_MESSAGE = 'PUBLIC_CHAT_MESSAGE';
const PRIVATE_CHAT_MESSAGE = 'PRIVATE_CHAT_MESSAGE';

const EventNames = {
  RECORDING_ATTRIBUTE,
  RAISED_ATTRIBUTE,
  ROLE_ATTRIBUTE,
  PUBLIC_CHAT_MESSAGE,
  PRIVATE_CHAT_MESSAGE,
};
/** ***** EVENT NAMES ENDS ***** */

export {EventActions, EventNames};
