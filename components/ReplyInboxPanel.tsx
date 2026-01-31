
import React, { useState } from 'react';
import { Prospect, InboundMessage } from '../types';
import { classifyReply } from '../services/replyClassifier';
import { applyReply } from '../services/replyApplier';
import { MessageSquare, Zap, CheckCircle2 } from 'lucide-react';

const uid = () => `inb_${Math.random().toString(16).slice(2)}_${Date.now()}`;

export default function ReplyInboxPanel(props: {
  prospect: Prospect;
  onUpdateProspect: (p: Prospect) => void;
}) {
  const [from, setFrom] = useState('');
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [processing, setProcessing] = useState(false);

  const inbounds = props.prospect.inbound || [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
         <MessageSquare className="w-5 h-5"/> Inbox & Reply Handler
      </h3>

      {inbounds.length > 0 && (
          <div className="mb-6 space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase">Historique Inbound</h4>
              {inbounds.map(inb => {
                  const cls = props.prospect.replyClassifications?.[inb.id];
                  return (
                      <div key={inb.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <div className="flex justify-between mb-1">
                             <div className="font-bold text-sm">{inb.from}</div>
                             <div className="text-xs text-gray-500">{new Date(inb.receivedAt).toLocaleDateString()}</div>
                          </div>
                          <div className="text-xs text-gray-600 italic mb-2">"{inb.subject}"</div>
                          <div className="text-xs text-gray-800 whitespace-pre-wrap mb-2 pl-2 border-l-2 border-gray-300">{inb.text}</div>
                          {cls && (
                              <div className="mt-2 text-[10px] bg-indigo-50 text-indigo-800 p-2 rounded flex items-center gap-2">
                                  <Zap className="w-3 h-3"/>
                                  <span className="font-bold uppercase">{cls.intent}</span>
                                  <span>{cls.summary}</span>
                              </div>
                          )}
                      </div>
                  )
              })}
          </div>
      )}

      <div className="border-t border-gray-100 pt-4">
        <h4 className="text-sm font-bold text-gray-800 mb-3">Simuler une réponse (ou coller reçu)</h4>
        
        <div className="grid grid-cols-2 gap-2 mb-2">
            <input 
                value={from} 
                onChange={(e) => setFrom(e.target.value)} 
                placeholder="From (email)" 
                className="px-3 py-2 border rounded-lg text-xs" 
            />
            <input 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                placeholder="Subject" 
                className="px-3 py-2 border rounded-lg text-xs" 
            />
        </div>

        <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Collez le corps de la réponse ici…"
            className="w-full h-28 font-mono text-xs p-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
        />

        <button
            onClick={async () => {
            setProcessing(true);
            const inbound: InboundMessage = {
                id: uid(),
                channel: 'email',
                from,
                to: '',
                subject,
                text,
                receivedAt: Date.now(),
                matchedBy: 'manual',
            };

            const cls = await classifyReply({ subject, text, context: { businessName: props.prospect.name } });
            const next = applyReply(props.prospect, inbound, cls);
            props.onUpdateProspect(next);

            // reset
            setFrom(''); setSubject(''); setText('');
            setProcessing(false);
            }}
            disabled={!text.trim() || processing}
            className="mt-3 px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold disabled:opacity-40 flex items-center gap-2"
        >
            {processing ? 'Analyzing...' : 'Classify & Apply'}
        </button>
      </div>
    </div>
  );
}
