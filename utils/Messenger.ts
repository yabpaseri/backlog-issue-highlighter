import { defineExtensionMessaging } from '@webext-core/messaging';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ProtocolMap {}

export const Messenger = defineExtensionMessaging<ProtocolMap>();
