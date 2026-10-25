import * as React from 'react';

import { fireEvent, screen } from '@testing-library/react';
import { render, waitFor } from '@tests/utils';
import { http, HttpResponse } from 'msw';
import { Routes, Route } from 'react-router-dom';

import { server } from '../../../tests/utils';
import { EditConfigurationPage } from '../EditConfigurationPage';

const EDIT_ATTRIBUTES = [
  [
    { name: 'slug', size: 6 },
    { name: 'repeat_req_min', size: 12 },
    { name: 'json', size: 12 },
  ],
];

describe('EditConfigurationPage', () => {
  it('renders correctly', async () => {
    const { getByRole, findByRole } = render(
      <Routes>
        <Route
          path="/content-manager/:collectionType/:slug/configuration/edit"
          element={<EditConfigurationPage />}
        />
      </Routes>,
      {
        initialEntries: [
          '/content-manager/collection-types/api::address.address/configuration/edit',
        ],
      }
    );

    await findByRole('heading', { name: 'Configure the view - Address' });

    expect(getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(getByRole('link', { name: 'Back' })).toBeInTheDocument();

    expect(getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(getByRole('combobox', { name: 'Entry title' })).toBeInTheDocument();

    expect(getByRole('heading', { name: 'View' })).toBeInTheDocument();

    EDIT_ATTRIBUTES.forEach((attributeRow) =>
      attributeRow.forEach((attribute) => {
        expect(getByRole('button', { name: `Edit ${attribute.name}` })).toBeInTheDocument();
        expect(getByRole('button', { name: `Delete ${attribute.name}` })).toBeInTheDocument();
      })
    );

    expect(getByRole('button', { name: 'Insert another field' })).toBeInTheDocument();
  });

  it('should add field and set it to disabled once all fields are showing', async () => {
    const { user, findByRole, findByText } = render(
      <Routes>
        <Route
          path="/content-manager/:collectionType/:slug/configuration/edit"
          element={<EditConfigurationPage />}
        />
      </Routes>,
      {
        initialEntries: [
          '/content-manager/collection-types/api::address.address/configuration/edit',
        ],
      }
    );

    await findByRole('heading', { name: 'Configure the view - Address' });

    await user.click(await findByRole('button', { name: 'Insert another field' }));

    await user.click(await findByRole('menuitem', { name: 'postal_code' }));

    EDIT_ATTRIBUTES.forEach(async (attributeRow) =>
      [...attributeRow, { name: 'postal_code' }].forEach(async (attribute) => {
        expect(await findByRole('button', { name: `Edit ${attribute.name}` })).toBeInTheDocument();
        expect(
          await findByRole('button', { name: `Delete ${attribute.name}` })
        ).toBeInTheDocument();
      })
    );

    expect(await findByRole('button', { name: 'Insert another field' })).toBeDisabled();

    fireEvent.click(await findByRole('button', { name: 'Save' }));

    await findByText('Saved');
  });

  it('should delete field', async () => {
    const { queryByRole, findByText, findByRole, getByRole, user } = render(
      <Routes>
        <Route
          path="/content-manager/:collectionType/:slug/configuration/edit"
          element={<EditConfigurationPage />}
        />
      </Routes>,
      {
        initialEntries: [
          '/content-manager/collection-types/api::address.address/configuration/edit',
        ],
      }
    );

    await findByRole('heading', { name: 'Configure the view - Address' });

    expect(await findByRole('button', { name: 'Delete json' })).toBeInTheDocument();

    await user.click(getByRole('button', { name: 'Delete json' }));

    await waitFor(() => {
      expect(queryByRole('button', { name: 'Delete json' })).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(queryByRole('button', { name: 'Edit json' })).not.toBeInTheDocument();
    });

    fireEvent.click(await findByRole('button', { name: 'Save' }));

    await findByText('Saved');
  });

  it('should update field metadata and send it to the server', async () => {
    let capturedBody: {
      metadatas?: Record<string, { edit?: { label?: string; description?: string } }>;
    } = {};

    server.use(
      http.put('/content-manager/content-types/:model/configuration', async ({ request }) => {
        capturedBody = (await request.json()) as typeof capturedBody;
        return new HttpResponse();
      })
    );

    const { user, findByRole, findByText } = render(
      <Routes>
        <Route
          path="/content-manager/:collectionType/:slug/configuration/edit"
          element={<EditConfigurationPage />}
        />
      </Routes>,
      {
        initialEntries: [
          '/content-manager/collection-types/api::address.address/configuration/edit',
        ],
      }
    );

    await findByRole('heading', { name: 'Configure the view - Address' });

    await user.click(await findByRole('button', { name: 'Edit slug' }));

    const labelInput = await findByRole('textbox', { name: 'Label' });
    await user.clear(labelInput);
    await user.type(labelInput, 'Custom Slug Label');

    const descInput = await findByRole('textbox', { name: 'Description' });
    await user.type(descInput, 'Custom Description');

    fireEvent.click(await findByRole('button', { name: 'Finish' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Edit Slug' })).not.toBeInTheDocument();
    });

    fireEvent.click(await findByRole('button', { name: 'Save' }));

    await findByText('Saved');

    expect(capturedBody.metadatas?.slug?.edit?.label).toBe('Custom Slug Label');
    expect(capturedBody.metadatas?.slug?.edit?.description).toBe('Custom Description');
  });
});
