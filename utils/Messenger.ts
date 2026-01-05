import { defineExtensionMessaging } from '@webext-core/messaging';

interface ProtocolMap {
	about(): Record<string, unknown>;
}

export const Messenger = defineExtensionMessaging<ProtocolMap>({});
