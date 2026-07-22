import { useEffect, useState } from 'react';
import PageLayout from '@/components/atelier/PageLayout';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';

type SizeOption = { label: string; price: number | ''; personalizedPrice?: number | '' | null };
type FieldType = 'string' | 'number' | 'boolean' | 'json';

type AdminItem = {
  id: string;
  data: Record<string, any>;
};

type ItemStatus = {
  status: 'idle' | 'saving' | 'saved' | 'error';
  message?: string;
};

const COLLECTIONS = [
  { id: 'stationery_essential', label: 'Stationery - Essential' },
  { id: 'stationery_premium', label: 'Stationery - Premium' },
  { id: 'stationery_money', label: 'Stationery - Money' },
  { id: 'stationery_hampers', label: 'Stationery - Hampers' },
  { id: 'gifting_travel', label: 'Gifting - Travel' },
  { id: 'gifting_coasters', label: 'Gifting - Coasters' },
  { id: 'gifting_wine', label: 'Gifting - Wine' },
  { id: 'coffeetablebooks', label: 'Coffee Table Books' },
  { id: 'invitations', label: 'Invitations' },
  { id: 'hampers', label: 'Hampers' },
];

const RESERVED_FIELDS = new Set(['name', 'img', 'price', 'personalizedPrice', 'sizes']);
const KNOWN_OPTION_FIELDS: Array<{ key: string; label: string; type: FieldType; defaultValue: any }> = [
  { key: 'goldFoil', label: 'Gold Foil', type: 'boolean', defaultValue: false },
];
const KNOWN_OPTION_FIELD_LABELS = Object.fromEntries(
  KNOWN_OPTION_FIELDS.map((field) => [field.key, field.label])
);

const getFieldType = (value: any): FieldType => {
  if (value === null || value === undefined) return 'string';
  if (Array.isArray(value) || typeof value === 'object') return 'json';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  return 'string';
};

export default function Admin() {
  const adminPassword =
    (import.meta.env.VITE_ADMIN_PAGE_PASSWORD || undefined) ||
    (import.meta.env.ADMIN_PAGE_PASSWORD || undefined) ||
    '';
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [itemsByCollection, setItemsByCollection] = useState<Record<string, AdminItem[]>>({});
  const [drafts, setDrafts] = useState<Record<string, Record<string, any>>>({});
  const [fieldTypes, setFieldTypes] = useState<Record<string, Record<string, FieldType>>>({});
  const [statusByItem, setStatusByItem] = useState<Record<string, ItemStatus>>({});

  useEffect(() => {
    if (!adminPassword) return;
    const stored = sessionStorage.getItem('admin-auth');
    if (stored === 'true') {
      setIsAuthorized(true);
    }
  }, [adminPassword]);

  useEffect(() => {
    if (!isAuthorized || !adminPassword) return;
    const loadData = async () => {
      const nextItems: Record<string, AdminItem[]> = {};
      const nextDrafts: Record<string, Record<string, any>> = {};
      const nextTypes: Record<string, Record<string, FieldType>> = {};

      await Promise.all(
        COLLECTIONS.map(async (collectionInfo) => {
          const snap = await getDocs(collection(db, collectionInfo.id));
          const items: AdminItem[] = [];
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            items.push({ id: docSnap.id, data });

            const itemKey = `${collectionInfo.id}/${docSnap.id}`;
            const types: Record<string, FieldType> = {};
            const draft: Record<string, any> = {};

            Object.entries(data).forEach(([key, value]) => {
              const type = getFieldType(value);
              types[key] = type;
              if (type === 'json') {
                draft[key] = JSON.stringify(value ?? null, null, 2);
              } else {
                draft[key] = value ?? '';
              }
            });

            if (!('price' in draft)) {
              draft.price = '';
              types.price = 'number';
            }
            if (!('personalizedPrice' in draft)) {
              draft.personalizedPrice = '';
              types.personalizedPrice = 'number';
            }
            if (!('sizes' in draft)) {
              draft.sizes = [];
              types.sizes = 'json';
            }
            KNOWN_OPTION_FIELDS.forEach((field) => {
              if (!(field.key in draft)) {
                draft[field.key] = field.defaultValue;
                types[field.key] = field.type;
              }
            });

            nextDrafts[itemKey] = {
              name: draft.name ?? '',
              img: draft.img ?? '',
              price: draft.price ?? '',
              personalizedPrice: draft.personalizedPrice ?? '',
              sizes: Array.isArray(data.sizes)
                ? data.sizes.map((size: any) => ({
                    label: typeof size?.label === 'string' ? size.label : '',
                    price:
                      typeof size?.price === 'number'
                        ? size.price
                        : size?.price === null || size?.price === undefined || size?.price === ''
                          ? ''
                          : Number(size?.price),
                    personalizedPrice:
                      typeof size?.personalizedPrice === 'number'
                        ? size.personalizedPrice
                        : size?.personalizedPrice === null || size?.personalizedPrice === undefined || size?.personalizedPrice === ''
                          ? ''
                          : Number(size?.personalizedPrice),
                  }))
                : [],
              ...Object.fromEntries(
                Object.entries(draft).filter(([key]) => !RESERVED_FIELDS.has(key))
              ),
            };
            nextTypes[itemKey] = types;
          });
          nextItems[collectionInfo.id] = items;
        })
      );

      setItemsByCollection(nextItems);
      setDrafts(nextDrafts);
      setFieldTypes(nextTypes);
    };

    loadData();
  }, [adminPassword, isAuthorized]);

  const handlePasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!adminPassword) {
      setPasswordError('Admin password is not configured.');
      return;
    }
    if (passwordInput === adminPassword) {
      sessionStorage.setItem('admin-auth', 'true');
      setIsAuthorized(true);
      setPasswordError('');
      setPasswordInput('');
      return;
    }
    setPasswordError('Incorrect password.');
  };

  const updateDraft = (itemKey: string, key: string, value: any) => {
    setDrafts((prev) => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        [key]: value,
      },
    }));
    setStatusByItem((prev) => ({
      ...prev,
      [itemKey]: { status: 'idle' },
    }));
  };

  const updateSize = (itemKey: string, index: number, field: 'label' | 'price' | 'personalizedPrice', value: string) => {
    setDrafts((prev) => {
      const sizes = Array.isArray(prev[itemKey]?.sizes) ? [...prev[itemKey].sizes] : [];
      const current = sizes[index] || { label: '', price: '', personalizedPrice: '' };
      sizes[index] = {
        ...current,
        [field]: field === 'label' ? value : value === '' ? '' : Number(value),
      };
      return {
        ...prev,
        [itemKey]: {
          ...prev[itemKey],
          sizes,
        },
      };
    });
    setStatusByItem((prev) => ({
      ...prev,
      [itemKey]: { status: 'idle' },
    }));
  };

  const addSize = (itemKey: string) => {
    setDrafts((prev) => {
      const sizes = Array.isArray(prev[itemKey]?.sizes) ? [...prev[itemKey].sizes] : [];
      sizes.push({ label: '', price: '', personalizedPrice: '' });
      return {
        ...prev,
        [itemKey]: {
          ...prev[itemKey],
          sizes,
        },
      };
    });
  };

  const removeSize = (itemKey: string, index: number) => {
    setDrafts((prev) => {
      const sizes = Array.isArray(prev[itemKey]?.sizes) ? [...prev[itemKey].sizes] : [];
      sizes.splice(index, 1);
      return {
        ...prev,
        [itemKey]: {
          ...prev[itemKey],
          sizes,
        },
      };
    });
  };

  const handleSave = async (collectionId: string, itemId: string) => {
    const itemKey = `${collectionId}/${itemId}`;
    const draft = drafts[itemKey];
    const types = fieldTypes[itemKey] || {};

    if (!draft) return;

    setStatusByItem((prev) => ({ ...prev, [itemKey]: { status: 'saving' } }));

    const payload: Record<string, any> = {};
    const reserved = ['name', 'img', 'price', 'personalizedPrice', 'sizes'];

    payload.name = String(draft.name ?? '');
    payload.img = String(draft.img ?? '');

    const priceValue = draft.price === '' ? null : Number(draft.price);
    payload.price = Number.isFinite(priceValue) ? priceValue : null;

    const personalizedValue = draft.personalizedPrice === '' ? null : Number(draft.personalizedPrice);
    payload.personalizedPrice = Number.isFinite(personalizedValue) ? personalizedValue : null;

    const sizes = Array.isArray(draft.sizes)
      ? draft.sizes
          .map((size: SizeOption) => {
            const price = Number(size.price);
            const personalizedPrice =
              size.personalizedPrice === '' || size.personalizedPrice === null || size.personalizedPrice === undefined
                ? null
                : Number(size.personalizedPrice);
            return {
              label: String(size.label ?? '').trim(),
              price,
              personalizedPrice: Number.isFinite(personalizedPrice) ? personalizedPrice : null,
            };
          })
          .filter((size: SizeOption) => size.label && Number.isFinite(size.price))
      : [];
    payload.sizes = sizes;

    for (const [key, value] of Object.entries(draft)) {
      if (reserved.includes(key)) continue;
      const type = types[key] ?? getFieldType(value);
      if (type === 'json') {
        try {
          payload[key] = value ? JSON.parse(String(value)) : null;
        } catch (error) {
          setStatusByItem((prev) => ({
            ...prev,
            [itemKey]: { status: 'error', message: `Invalid JSON in ${key}.` },
          }));
          return;
        }
      } else if (type === 'number') {
        const numValue = value === '' ? null : Number(value);
        payload[key] = Number.isFinite(numValue) ? numValue : null;
      } else if (type === 'boolean') {
        payload[key] = Boolean(value);
      } else {
        payload[key] = value ?? '';
      }
    }

    try {
      await updateDoc(doc(db, collectionId, itemId), payload);
      setStatusByItem((prev) => ({
        ...prev,
        [itemKey]: { status: 'saved' },
      }));
    } catch (error) {
      setStatusByItem((prev) => ({
        ...prev,
        [itemKey]: { status: 'error', message: 'Save failed.' },
      }));
    }
  };

  return (
    <PageLayout>
      <section className="max-w-6xl mx-auto px-6 lg:px-12 py-16 lg:py-20">
        {!isAuthorized ? (
          <div className="max-w-md">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-light">
              Admin Access
            </p>
            <h1 className="font-sans text-3xl md:text-4xl mb-8">Enter Password</h1>
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              {passwordError && (
                <div className="border border-red-200 bg-red-50/60 text-red-800 px-4 py-2 text-sm font-light">
                  {passwordError}
                </div>
              )}
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-light">
                  Password
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(event) => setPasswordInput(event.target.value)}
                  className="w-full bg-transparent border-b border-border py-2 font-light focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
              <button
                type="submit"
                className="border border-border px-6 py-3 text-xs uppercase tracking-widest font-light hover:border-foreground/40 transition-colors"
              >
                Enter
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="mb-12">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-light">
                Admin
              </p>
              <h1 className="font-sans text-3xl md:text-4xl">Catalog Manager</h1>
            </div>

            <div className="space-y-16">
              {COLLECTIONS.map((collectionInfo) => (
                <div key={collectionInfo.id} className="space-y-6">
                  <h2 className="text-lg font-sans">{collectionInfo.label}</h2>
                  <div className="space-y-6">
                    {(itemsByCollection[collectionInfo.id] || []).map((item) => {
                      const itemKey = `${collectionInfo.id}/${item.id}`;
                      const draft = drafts[itemKey] || {};
                      const types = fieldTypes[itemKey] || {};
                      const status = statusByItem[itemKey] || { status: 'idle' };
                      const otherFields = Object.keys(draft).filter(
                        (key) => !RESERVED_FIELDS.has(key)
                      );

                      return (
                        <div
                          key={itemKey}
                          className="border border-border p-6 space-y-6"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-xs uppercase tracking-widest text-muted-foreground font-light">
                                {item.id}
                              </p>
                            </div>
                            <button
                              onClick={() => handleSave(collectionInfo.id, item.id)}
                              className="border border-border px-4 py-2 text-xs uppercase tracking-widest font-light hover:border-foreground/40 transition-colors"
                            >
                              {status.status === 'saving' ? 'Saving...' : 'Save'}
                            </button>
                          </div>

                          {status.status === 'error' && (
                            <div className="border border-red-200 bg-red-50/60 text-red-800 px-4 py-2 text-sm font-light">
                              {status.message || 'Save failed.'}
                            </div>
                          )}
                          {status.status === 'saved' && (
                            <div className="border border-emerald-200 bg-emerald-50/60 text-emerald-800 px-4 py-2 text-sm font-light">
                              Saved.
                            </div>
                          )}

                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-light">
                                Name
                              </label>
                              <input
                                type="text"
                                value={draft.name ?? ''}
                                onChange={(event) => updateDraft(itemKey, 'name', event.target.value)}
                                className="w-full bg-transparent border-b border-border py-2 font-light focus:outline-none focus:border-foreground transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-light">
                                Image URLS
                              </label>
                              <textarea
                                value={draft.img ?? ''}
                                onChange={(event) => updateDraft(itemKey, 'img', event.target.value)}
                                className="w-full border border-border bg-background px-3 py-2 text-sm font-light text-foreground/80 focus:outline-none focus:ring-1 focus:ring-foreground/20"
                                rows={3}
                              />
                            </div>
                            <div>
                              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-light">
                                Price
                              </label>
                              <input
                                type="number"
                                value={draft.price ?? ''}
                                onChange={(event) => updateDraft(itemKey, 'price', event.target.value)}
                                className="w-full bg-transparent border-b border-border py-2 font-light focus:outline-none focus:border-foreground transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-light">
                                Personalized Price
                              </label>
                              <input
                                type="number"
                                value={draft.personalizedPrice ?? ''}
                                onChange={(event) => updateDraft(itemKey, 'personalizedPrice', event.target.value)}
                                className="w-full bg-transparent border-b border-border py-2 font-light focus:outline-none focus:border-foreground transition-colors"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-xs uppercase tracking-widest text-muted-foreground font-light">
                                Sizes
                              </p>
                              <button
                                onClick={() => addSize(itemKey)}
                                className="border border-border px-3 py-1 text-xs uppercase tracking-widest font-light hover:border-foreground/40 transition-colors"
                              >
                                Add size
                              </button>
                            </div>
                            {(Array.isArray(draft.sizes) ? draft.sizes : []).map((size: SizeOption, index: number) => (
                              <div key={`${itemKey}-size-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_150px_190px_auto] gap-3 items-center">
                                <input
                                  type="text"
                                  value={size.label}
                                  onChange={(event) => updateSize(itemKey, index, 'label', event.target.value)}
                                  placeholder="Size label"
                                  className="w-full bg-transparent border-b border-border py-2 font-light focus:outline-none focus:border-foreground transition-colors"
                                />
                                <input
                                  type="number"
                                  value={Number.isFinite(size.price) ? size.price : ''}
                                  onChange={(event) => updateSize(itemKey, index, 'price', event.target.value)}
                                  placeholder="Price"
                                  className="w-full bg-transparent border-b border-border py-2 font-light focus:outline-none focus:border-foreground transition-colors"
                                />
                                <input
                                  type="number"
                                  value={Number.isFinite(size.personalizedPrice) ? size.personalizedPrice : ''}
                                  onChange={(event) => updateSize(itemKey, index, 'personalizedPrice', event.target.value)}
                                  placeholder="Personalized price"
                                  className="w-full bg-transparent border-b border-border py-2 font-light focus:outline-none focus:border-foreground transition-colors"
                                />
                                <button
                                  onClick={() => removeSize(itemKey, index)}
                                  className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>

                          {otherFields.length > 0 && (
                            <div className="space-y-4">
                              <p className="text-xs uppercase tracking-widest text-muted-foreground font-light">
                                Options / Other Fields
                              </p>
                              <div className="grid md:grid-cols-2 gap-6">
                                {otherFields.map((key) => {
                                  const type = types[key] ?? getFieldType(draft[key]);
                                  const value = draft[key] ?? '';
                                  return (
                                    <div key={`${itemKey}-${key}`}>
                                      <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-light">
                                        {KNOWN_OPTION_FIELD_LABELS[key] ?? key}
                                      </label>
                                      {type === 'boolean' ? (
                                        <input
                                          type="checkbox"
                                          checked={Boolean(value)}
                                          onChange={(event) => updateDraft(itemKey, key, event.target.checked)}
                                          className="h-4 w-4"
                                        />
                                      ) : type === 'json' ? (
                                        <textarea
                                          value={String(value)}
                                          onChange={(event) => updateDraft(itemKey, key, event.target.value)}
                                          className="w-full border border-border bg-background px-3 py-2 text-sm font-light text-foreground/80 focus:outline-none focus:ring-1 focus:ring-foreground/20"
                                          rows={4}
                                        />
                                      ) : (
                                        <input
                                          type={type === 'number' ? 'number' : 'text'}
                                          value={value}
                                          onChange={(event) => updateDraft(itemKey, key, event.target.value)}
                                          className="w-full bg-transparent border-b border-border py-2 font-light focus:outline-none focus:border-foreground transition-colors"
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </PageLayout>
  );
}
