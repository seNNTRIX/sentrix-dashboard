import React from 'react';

export function CandidateTypeTag({kind, label}) {
 if (!label || label === '—') return <span>—</span>;
 if (kind !== 'NODE' && kind !== 'EDGE') return <span>{label}</span>;
 return <span className={`rca-tag ${kind.toLowerCase()}`}>{label}</span>;
}
