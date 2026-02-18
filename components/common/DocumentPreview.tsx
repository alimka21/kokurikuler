
import React from 'react';
import { ProjectState } from '../../types';

interface Props {
    project: ProjectState;
}

const DocumentPreview: React.FC<Props> = ({ project }) => {
    
    const formatDate = (d: string) => {
        if (!d) return "";
        return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    const getAlphabetIndex = (index: number) => String.fromCharCode(65 + index);
    const uniqueSubjects = Array.from(new Set(project.projectGoals.flatMap(g => g.subjects)));

    return (
        <div className="bg-slate-500/10 rounded-3xl p-6 sm:p-10 border border-slate-200/50 flex flex-col items-center overflow-y-auto min-h-[600px] relative inner-shadow max-h-[80vh]">
             <div 
                className="bg-white text-black p-16 flex flex-col shadow-2xl origin-top flex-shrink-0"
                style={{ 
                    width: '595px', // Standard A4 width in px for web
                    minHeight: '842px', // Minimum A4 height
                    height: 'auto', // UPDATED: Allow growth
                    fontFamily: '"Times New Roman", Times, serif',
                    lineHeight: '1.5',
                    transform: 'scale(0.85)',
                    transformOrigin: 'top center', // Ensure scaling starts from top
                    marginTop: '-20px',
                    marginBottom: '20px' 
                }}
            >
                {/* 18pt = 24px (approx) in web scale for 1.5 zoom */}
                <h1 className="text-center font-bold text-2xl mb-1 text-black">MODUL PROJEK</h1>
                {/* 14pt = 18.7px (approx) */}
                <h2 className="text-center text-xl uppercase text-black">{project?.schoolName || "NAMA SEKOLAH"}</h2>

                {/* Table 1: Identitas */}
                <table className="w-full border-collapse border border-black mb-6 text-lg mt-8">
                    <thead>
                        <tr><th colSpan={2} className="border border-black bg-gray-200 p-2 text-center">Identitas Projek</th></tr>
                    </thead>
                    <tbody>
                        <tr><td className="border border-black p-2 font-bold w-1/3">Tema Projek</td><td className="border border-black p-2">{project?.selectedTheme}</td></tr>
                        <tr><td className="border border-black p-2 font-bold">Bentuk Kegiatan</td><td className="border border-black p-2">{project?.activityFormat}</td></tr>
                        <tr><td className="border border-black p-2 font-bold">Ide Projek</td><td className="border border-black p-2">{project?.title === "MODUL PROJEK" ? "-" : project?.title}</td></tr>
                        <tr><td className="border border-black p-2 font-bold">Kelas</td><td className="border border-black p-2">{project?.targetClass}</td></tr>
                        <tr><td className="border border-black p-2 font-bold">Alokasi Waktu</td><td className="border border-black p-2">{project?.projectJpAllocation} JP</td></tr>
                        <tr>
                            <td className="border border-black p-2 font-bold align-top">Mata Pelajaran Terkait</td>
                            <td className="border border-black p-2 align-top">
                                    {uniqueSubjects.length > 0 ? (
                                    <ol className="list-decimal pl-5 m-0 space-y-1">
                                        {uniqueSubjects.map(s => <li key={s}>{s}</li>)}
                                    </ol>
                                    ) : "-"}
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold align-top">Lokasi Kegiatan</td>
                            <td className="border border-black p-2 align-top">
                                {project?.activityLocations && project.activityLocations.length > 0 ? (
                                    <ol className="list-decimal pl-5 m-0 space-y-1">
                                        {project.activityLocations.map((loc, idx) => (
                                            <li key={idx}>{loc}</li>
                                        ))}
                                    </ol>
                                ) : "-"}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Table 2: Deskripsi */}
                <table className="w-full border-collapse border border-black mb-6 text-lg">
                    <thead>
                        <tr><th className="border border-black bg-gray-200 p-2 text-center">Deskripsi Singkat Projek</th></tr>
                    </thead>
                    <tbody>
                        <tr><td className="border border-black p-3">{project?.projectDescription || "Belum ada deskripsi."}</td></tr>
                    </tbody>
                </table>

                {/* Table 3: Detail */}
                <table className="w-full border-collapse border border-black mb-6 text-lg">
                    <tbody>
                        <tr>
                            <td className="border border-black p-2 font-bold w-1/3 align-top">Dimensi Profil Lulusan</td>
                            <td className="border border-black p-2 align-top">
                                <ol className="list-decimal pl-5 m-0 space-y-2">
                                    {project?.selectedDimensions.map(d => (
                                        <li key={d}>{d}</li>
                                    ))}
                                </ol>
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold align-top">Tujuan Projek</td>
                            <td className="border border-black p-2 align-top">
                                <ol className="list-decimal pl-5 m-0 space-y-2">
                                    {project?.projectGoals.map(g => (
                                        <li key={g.id}>{g.description}</li>
                                    ))}
                                </ol>
                            </td>
                        </tr>
                    </tbody>
                </table>
                
                {/* Table 4: Kegiatan */}
                <table className="w-full border-collapse border border-black mb-6 text-lg">
                    <thead>
                        <tr><th className="border border-black bg-gray-200 p-2 text-center">Kegiatan Projek</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-black p-3 align-top">
                                {project?.activities.map((act, i) => (
                                    <div key={act.id} className="mb-6">
                                        <div className="font-bold mb-2">
                                            {getAlphabetIndex(i)}. {act.name} ({act.jp} JP)
                                        </div>
                                        {act.steps && act.steps.length > 0 ? (
                                            <ol className="list-decimal pl-5 m-0 space-y-1 text-base">
                                                {act.steps.map((step, idx) => (
                                                    <li key={idx}>{step.replace(/^\d+[\.\)]\s*/, '')}</li>
                                                ))}
                                            </ol>
                                        ) : (
                                            <p className="pl-4 mt-1 text-base italic text-gray-500">{act.description}</p>
                                        )}
                                    </div>
                                ))}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Table 5: Asesmen (14pt Bold Header) */}
                <h2 className="text-center font-bold text-xl mb-2 mt-4 text-black">Asesmen Projek</h2>
                <table className="w-full border-collapse border border-black mb-6 text-sm">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border border-black p-2">Dimensi</th>
                            <th className="border border-black p-2">Aspek</th>
                            <th className="border border-black p-2">Sangat Baik</th>
                            <th className="border border-black p-2">Baik</th>
                            <th className="border border-black p-2">Cukup</th>
                            <th className="border border-black p-2">Kurang</th>
                        </tr>
                    </thead>
                    <tbody>
                        {project.assessmentRubrics && project.assessmentRubrics.length > 0 ? (
                            project.assessmentRubrics.map((dimGroup, i) => (
                                dimGroup.rubrics.map((rubric, j) => (
                                    <tr key={`${i}-${j}`}>
                                        <td className="border border-black p-2 font-bold">{j === 0 ? dimGroup.dimensionName : ''}</td>
                                        <td className="border border-black p-2">{rubric.aspect}</td>
                                        <td className="border border-black p-2">{rubric.score4}</td>
                                        <td className="border border-black p-2">{rubric.score3}</td>
                                        <td className="border border-black p-2">{rubric.score2}</td>
                                        <td className="border border-black p-2">{rubric.score1}</td>
                                    </tr>
                                ))
                            ))
                        ) : (
                            <tr><td colSpan={6} className="border border-black p-2 text-center text-gray-500">-</td></tr>
                        )}
                    </tbody>
                </table>

                {/* Signatures */}
                <div className="mt-8 flex justify-between px-4 text-lg">
                    <div className="text-center w-1/2">
                        <p>Kepala Sekolah</p>
                        <br/><br/><br/>
                        <p className="font-bold underline">{project?.principalName || "Nama..."}</p>
                        <p>NIP. {project?.principalNip}</p>
                    </div>
                    <div className="text-center w-1/2">
                        <p>{project?.signaturePlace}, {formatDate(project?.signatureDate || "")}</p>
                        <p>Koordinator Projek</p>
                        <br/><br/><br/>
                        <p className="font-bold underline">{project?.coordinatorName || "Nama..."}</p>
                        <p>NIP. {project?.coordinatorNip}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentPreview;
