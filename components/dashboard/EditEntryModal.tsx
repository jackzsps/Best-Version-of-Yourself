import React, { useState } from 'react';
import { Entry, ExpenseCategory, PaymentMethod, UsageCategory, EntryType, Theme } from '../../types';
import Button from '../Button';
import { TrashIcon, XIcon } from '../Icons';
import { 
  VintageInput, VintageSelect, VintageTextArea, 
  BentoInput, BentoSelect, BentoTextArea, 
  ThemeDateInput, getUsagePillStyle 
} from '../ThemeUI';

const getLocalDateString = (timestamp: number) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const EditEntryModal = ({ 
  entry, 
  onClose, 
  onUpdate, 
  onDelete,
  t,
  theme
}: { 
  entry: Entry, 
  onClose: () => void, 
  onUpdate: (e: Entry) => void, 
  onDelete: (id: string) => void,
  t: any,
  theme: Theme
}) => {
  const [name, setName] = useState(entry.itemName);
  const [cost, setCost] = useState(entry.cost.toString());
  const [calories, setCalories] = useState(entry.calories.toString());
  const [protein, setProtein] = useState(entry.protein ? entry.protein.toString() : '');
  const [carbs, setCarbs] = useState(entry.carbs ? entry.carbs.toString() : '');
  const [fat, setFat] = useState(entry.fat ? entry.fat.toString() : '');
  
  const [note, setNote] = useState(entry.note || '');
  const [dateStr, setDateStr] = useState(getLocalDateString(entry.timestamp));
  const [category, setCategory] = useState<ExpenseCategory>(entry.category || 'food');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(entry.paymentMethod || 'cash');
  const [usage, setUsage] = useState<UsageCategory>(entry.usage || 'need');
  const [recordType, setRecordType] = useState<EntryType>(entry.type || 'combined');
  
  const [isDeleting, setIsDeleting] = useState(false);

  const categories: ExpenseCategory[] = ['food', 'transport', 'shopping', 'entertainment', 'bills', 'other'];
  const paymentMethods: PaymentMethod[] = ['cash', 'card', 'mobile'];
  const usageCategories: UsageCategory[] = ['must', 'need', 'want'];
  const entryTypes: EntryType[] = ['expense', 'diet', 'combined'];

  const isVintage = theme === 'vintage';

  const handleSave = () => {
    const originalDate = new Date(entry.timestamp);
    const [year, month, day] = dateStr.split('-').map(Number);
    const newTimestamp = new Date(year, month - 1, day, originalDate.getHours(), originalDate.getMinutes(), originalDate.getSeconds()).getTime();

    const costToSave = recordType === 'diet' ? 0 : (parseFloat(cost) || 0);
    const caloriesToSave = recordType === 'expense' ? 0 : (parseFloat(calories) || 0);
    const proteinToSave = recordType === 'expense' ? 0 : (parseFloat(protein) || 0);
    const carbsToSave = recordType === 'expense' ? 0 : (parseFloat(carbs) || 0);
    const fatToSave = recordType === 'expense' ? 0 : (parseFloat(fat) || 0);

    onUpdate({
      ...entry,
      itemName: name,
      cost: costToSave,
      calories: caloriesToSave,
      protein: proteinToSave,
      carbs: carbsToSave,
      fat: fatToSave,
      timestamp: newTimestamp,
      category,
      paymentMethod,
      usage,
      type: recordType,
      note: note
    });
    onClose();
  };

  const handleConfirmDelete = () => {
    onDelete(entry.id);
    onClose();
  };

  // Styles
  const containerClass = isVintage
    ? 'bg-vintage-card w-full max-w-sm p-6 relative shadow-[5px_5px_0px_rgba(44,36,27,0.2)] animate-fade-in-up max-h-[90vh] overflow-y-auto border-2 border-vintage-line rounded-sm'
    : 'bg-white rounded-[2rem] w-full max-w-sm p-6 relative shadow-soft animate-fade-in-up max-h-[90vh] overflow-y-auto';

  const labelClass = isVintage
    ? 'block text-xs font-bold uppercase mb-1 text-vintage-leather font-typewriter'
    : 'block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 font-sans';

  const closeBtnClass = isVintage
    ? 'p-2 text-vintage-leather hover:text-vintage-ink transition-colors'
    : 'p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors text-gray-600';

  if (isDeleting) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsDeleting(false)}></div>
        <div className={`${containerClass} flex flex-col items-center text-center justify-center min-h-[300px]`}>
           
           {isVintage ? (
             <div className="border-4 border-double border-vintage-stamp p-6 -rotate-1 relative bg-vintage-bg">
                <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-vintage-stamp opacity-50"></div>
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-vintage-stamp opacity-50"></div>
                <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-vintage-stamp opacity-50"></div>
                <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-vintage-stamp opacity-50"></div>
                
                <h3 className="text-vintage-stamp font-typewriter text-2xl font-bold uppercase mb-4 tracking-widest border-b-2 border-vintage-stamp pb-2">
                   {t.dashboard.vintageDelete.title}
                </h3>
                <p className="font-handwriting text-xl text-vintage-ink mb-8">
                  {t.dashboard.vintageDelete.message}
                </p>
                <div className="flex gap-4">
                   <button onClick={() => setIsDeleting(false)} className="flex-1 py-2 px-4 border-2 border-vintage-ink font-typewriter text-vintage-ink hover:bg-vintage-ink hover:text-vintage-bg transition-colors">
                     {t.dashboard.vintageDelete.keep}
                   </button>
                   <button onClick={handleConfirmDelete} className="flex-1 py-2 px-4 bg-vintage-stamp text-white font-typewriter shadow-[2px_2px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all border-2 border-vintage-stamp">
                     {t.dashboard.vintageDelete.destroy}
                   </button>
                </div>
             </div>
           ) : (
             <div className="w-full">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <TrashIcon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{t.dashboard.confirmDelete}</h3>
                <p className="text-gray-500 mb-8 text-sm">{t.dashboard.deleteWarning}</p>
                <div className="flex flex-col gap-3 w-full">
                   <Button fullWidth onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200">
                     {t.common.delete}
                   </Button>
                   <Button fullWidth variant="ghost" onClick={() => setIsDeleting(false)}>
                     {t.common.cancel}
                   </Button>
                </div>
             </div>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
      <div className={containerClass}>
        
        {isVintage && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-3 w-4 h-4 rounded-full bg-vintage-line shadow-inner"></div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-bold ${isVintage ? 'text-vintage-ink font-typewriter' : 'text-gray-900'}`}>
            {t.dashboard.editEntry}
          </h3>
          <button onClick={onClose} className={closeBtnClass}>
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
           <div className={`flex p-1 ${isVintage ? 'border-b border-vintage-line pb-4 mb-2' : 'bg-gray-100 rounded-xl'}`}>
              {entryTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setRecordType(type)}
                  className={`flex-1 py-2 text-xs font-bold transition-all ${
                    recordType === type
                      ? (isVintage ? 'text-vintage-ink font-typewriter underline decoration-wavy decoration-vintage-stamp' : 'bg-white shadow-sm text-brand-600 rounded-lg')
                      : (isVintage ? 'text-vintage-leather/50 font-typewriter' : 'text-gray-400 hover:text-gray-600')
                  }`}
                >
                  {t.entryTypes[type]}
                </button>
              ))}
           </div>

           <div>
             <label className={labelClass}>{t.addEntry.date}</label>
             <ThemeDateInput 
               value={dateStr} 
               onChange={e => setDateStr(e.target.value)} 
               theme={theme}
             />
           </div>

           <div>
            <label className={labelClass}>{t.addEntry.itemName}</label>
            {isVintage
               ? <VintageInput type="text" value={name} onChange={e => setName(e.target.value)} />
               : <BentoInput type="text" value={name} onChange={e => setName(e.target.value)} />
            }
           </div>
           
           <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                 <label className={labelClass}>{t.addEntry.category}</label>
                 {isVintage
                   ? <VintageSelect value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)}>{categories.map(c => <option key={c} value={c}>{t.categories[c]}</option>)}</VintageSelect>
                   : <BentoSelect value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)}>{categories.map(c => <option key={c} value={c}>{t.categories[c]}</option>)}</BentoSelect>
                 }
              </div>

              {(recordType === 'expense' || recordType === 'combined') && (
                <div className="col-span-2">
                   <label className={labelClass}>{t.addEntry.usage}</label>
                   <div className="flex gap-2">
                    {usageCategories.map(u => (
                      <button
                        key={u}
                        onClick={() => setUsage(u)}
                        className={`flex-1 py-3 text-sm rounded-xl border transition-all ${
                           isVintage ? 'rounded-none border-2 font-typewriter' : ''
                        } ${getUsagePillStyle(u, usage === u, theme)}`}
                      >
                        {t.usage[u]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(recordType === 'expense' || recordType === 'combined') && (
                <div>
                   <label className={labelClass}>{t.addEntry.paymentMethod}</label>
                   {isVintage
                     ? <VintageSelect value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}>{paymentMethods.map(p => <option key={p} value={p}>{t.paymentMethods[p]}</option>)}</VintageSelect>
                     : <BentoSelect value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}>{paymentMethods.map(p => <option key={p} value={p}>{t.paymentMethods[p]}</option>)}</BentoSelect>
                   }
                </div>
              )}
           
             {(recordType === 'expense' || recordType === 'combined') && (
                <div>
                  <label className={labelClass}>{t.addEntry.cost}</label>
                  {isVintage
                    ? <VintageInput type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" />
                    : <BentoInput type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" />
                  }
                </div>
             )}
           </div>

           {(recordType === 'diet' || recordType === 'combined') && (
             <div className={`space-y-4 ${isVintage ? 'mt-4 border-t border-vintage-line pt-4 border-dashed' : 'bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mt-2'}`}>
                <div>
                  <label className={labelClass}>{t.addEntry.calories}</label>
                  {isVintage
                    ? <VintageInput type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="0" />
                    : <BentoInput type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="0" />
                  }
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                   <div>
                      <label className={labelClass}>{t.addEntry.protein}</label>
                      {isVintage
                        ? <VintageInput type="number" value={protein} onChange={e => setProtein(e.target.value)} className="!text-lg" placeholder="g" />
                        : <BentoInput type="number" value={protein} onChange={e => setProtein(e.target.value)} className="!p-3 !text-sm" placeholder="g" />
                      }
                   </div>
                   <div>
                      <label className={labelClass}>{t.addEntry.carbs}</label>
                      {isVintage
                        ? <VintageInput type="number" value={carbs} onChange={e => setCarbs(e.target.value)} className="!text-lg" placeholder="g" />
                        : <BentoInput type="number" value={carbs} onChange={e => setCarbs(e.target.value)} className="!p-3 !text-sm" placeholder="g" />
                      }
                   </div>
                   <div>
                      <label className={labelClass}>{t.addEntry.fat}</label>
                      {isVintage
                        ? <VintageInput type="number" value={fat} onChange={e => setFat(e.target.value)} className="!text-lg" placeholder="g" />
                        : <BentoInput type="number" value={fat} onChange={e => setFat(e.target.value)} className="!p-3 !text-sm" placeholder="g" />
                      }
                   </div>
                </div>
             </div>
           )}

           <div>
              <label className={labelClass}>{t.addEntry.note}</label>
              {isVintage
                ? <VintageTextArea value={note} onChange={e => setNote(e.target.value)} rows={3} />
                : <BentoTextArea value={note} onChange={e => setNote(e.target.value)} rows={3} />
              }
           </div>
           
           <div className="mt-8 flex gap-3">
             <button 
               onClick={() => setIsDeleting(true)} 
               className={isVintage 
                  ? 'flex items-center justify-center w-12 h-12 border-2 border-vintage-stamp text-vintage-stamp hover:bg-vintage-stamp/10 rounded-sm transition-colors'
                  : 'flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors'
               }
             >
               <TrashIcon className="w-5 h-5" />
             </button>
             <Button 
                fullWidth 
                onClick={handleSave} 
                variant={isVintage ? 'ghost' : 'primary'}
                className={isVintage 
                  ? 'bg-vintage-leather text-vintage-card font-typewriter shadow-md hover:bg-vintage-ink border-2 border-vintage-ink rounded-sm h-12' 
                  : 'rounded-2xl h-14 bg-gray-900 text-white shadow-soft hover:bg-black'
                } 
             >
                {t.common.update}
             </Button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default EditEntryModal;