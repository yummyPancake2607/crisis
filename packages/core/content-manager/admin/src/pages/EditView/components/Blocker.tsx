// Needs to be wrapped in a component to have access to the form context via a hook.
import * as React from 'react';

import { Blocker as BaseBlocker, useForm } from '@strapi/admin/strapi-admin';

/**
 * Prevents users from leaving the page with unsaved form changes
 */
const Blocker = () => {
  const resetForm = useForm('Blocker', (state) => state.resetForm);
  const modified = useForm('Blocker', (state) => state.modified);

  /**
   * The form is only dirty while the user is editing the document that is currently open,
   * so we remember its state when the navigation was set up to tell those edits apart from
   * values left over by a previous document.
   *
   * This must track the live `modified` flag, not just its value on first render:
   * a document normally opens clean and only becomes dirty when the user edits it.
   * A ref captured once at mount would still say "no pending edits" after the user
   * has edited, and cancelling the leave dialog would then reset the form and
   * wipe those edits.
   */
  const hadPendingEdits = React.useRef(modified);

  React.useEffect(() => {
    hadPendingEdits.current = modified;
  }, [modified]);

  // We reset the form to the published version to avoid errors like – https://strapi-inc.atlassian.net/browse/CONTENT-2284
  const handleProceed = () => {
    hadPendingEdits.current = false;
    resetForm();
  };

  const handleCancel = () => {
    // Cancelling must keep the form exactly as edited, so only reset when neither
    // the tracked state nor the live flag reports pending edits. Checking the live
    // flag as well means a stale ref can never wipe edits the user just made.
    if (!hadPendingEdits.current && !modified) {
      resetForm();
    }
  };

  return <BaseBlocker onProceed={handleProceed} onCancel={handleCancel} />;
};

export { Blocker };
