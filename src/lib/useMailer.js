import { useCallback } from 'react';
import { Just, Nothing } from 'folktale/maybe';

import { hasReceived, sendMail } from './inviteMail';
import useSetState from './useSetState';

const STUB_MAILER = process.env.REACT_APP_STUB_MAILER === 'true';

function useHasReceivedCache() {
  const [cache, addToCache] = useSetState();

  const getHasReceived = useCallback(
    email => cache[email] || Nothing(), //
    [cache]
  );

  const syncHasReceivedForEmail = useCallback(
    async email => {
      if (Just.hasInstance(getHasReceived(email))) {
        // never update the cache after we know about it
        return;
      }

      if (STUB_MAILER) {
        // always allow sending emails when stubbing
        return addToCache({ [email]: Just(false) });
      }

      const _hasReceived = await hasReceived(email);
      addToCache({ [email]: Just(_hasReceived) });
    },
    [getHasReceived, addToCache]
  );

  return { getHasReceived, syncHasReceivedForEmail };
}

export default function useMailer(emails) {
  const hasReceivedCache = useHasReceivedCache(emails);

  // prefix to avoid clobbering sendMail import
  // also throws if return value is false
  const _sendMail = useCallback(async (email, ticket, sender, rawTx) => {
    if (STUB_MAILER) {
      console.log(`${email} - ${ticket}`);
      return true;
    }

    return await sendMail(email, ticket, sender, rawTx);
  }, []);

  return { ...hasReceivedCache, sendMail: _sendMail };
}
