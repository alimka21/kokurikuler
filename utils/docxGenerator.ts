
import { 
    Document, 
    Packer, 
    Paragraph, 
    TextRun, 
    HeadingLevel, 
    Table, 
    TableRow, 
    TableCell, 
    WidthType, 
    BorderStyle,
    AlignmentType,
    VerticalAlign,
    PageOrientation,
    HeightRule
} from 'docx';
import FileSaver from 'file-saver';
import { ProjectState } from '../types';

// Helper for formatting date to Indonesian
const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

// Common Border Style for the "Form" look
const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
};

// --- MODUL PROJEK (Single Project) ---
export const generateAndDownloadDocx = async (project: ProjectState) => {
    
    // 1. Prepare Content Helpers
    const createBoldText = (text: string) => new Paragraph({ children: [new TextRun({ text, bold: true, font: "Times New Roman", size: 24 })] });
    // Fix: Remove explicit AlignmentType annotation to let TS infer or accept default
    const createText = (text: string, align: any = AlignmentType.LEFT) => new Paragraph({ 
        children: [new TextRun({ text, font: "Times New Roman", size: 24 })], 
        alignment: align 
    });

    // Helper: Create a standard label-value row for the main tables
    const createRow = (label: string, value: string) => new TableRow({
        children: [
            new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, font: "Times New Roman", size: 24 })] })],
                verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
                 width: { size: 70, type: WidthType.PERCENTAGE },
                 children: [new Paragraph({ children: [new TextRun({ text: value || "-", font: "Times New Roman", size: 24 })] })],
                 verticalAlign: VerticalAlign.CENTER,
            }),
        ]
    });

    // Helper: Header Row for tables
    const createHeaderRow = (text: string) => new TableRow({
        children: [
            new TableCell({
                columnSpan: 2,
                children: [new Paragraph({ 
                    children: [new TextRun({ text: text, bold: true, font: "Times New Roman", size: 24 })], 
                    alignment: AlignmentType.CENTER 
                })],
                shading: { fill: "E2E8F0" },
                verticalAlign: VerticalAlign.CENTER,
            })
        ]
    });

    // Data Processing
    const goalsList = project.projectGoals.map((g, i) => `${i+1}. ${g.description}`).join('\n');
    
    // Generated Locations (array -> string)
    // Fix: Remove activityLocation property access as it is removed from types
    const locationString = project.activityLocations && project.activityLocations.length > 0 
        ? project.activityLocations.join(", ") 
        : "-";

    // Full Description: Creative Description + Analysis Summary
    const fullDescription = project.projectDescription 
        ? `${project.projectDescription}\n\nAnalisis Konteks:\n${project.analysisSummary || ""}`
        : (project.analysisSummary || "Belum ada deskripsi.");

    // Activities List (Numbered)
    const activityParagraphs = project.activities.map((act, i) => 
        new Paragraph({ 
            children: [new TextRun({ text: `${i+1}. ${act.name} (${act.jp} JP)`, font: "Times New Roman", size: 24, bold: true })],
            spacing: { after: 100 }
        })
    );
    // Add descriptions to activities
    project.activities.forEach((act) => {
        activityParagraphs.push(new Paragraph({
            children: [new TextRun({ text: act.description, font: "Times New Roman", size: 24 })],
            indent: { left: 360 }, // Indent description
            spacing: { after: 200 }
        }));
    });

    // Assessment Rows
    const assessmentRows: TableRow[] = [
        new TableRow({
            tableHeader: true,
            children: [
                new TableCell({ children: [createBoldText("Dimensi Profil Lulusan")], verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [createBoldText("Aspek yang Dinilai")], verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [createBoldText("Kurang")], verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [createBoldText("Cukup")], verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [createBoldText("Baik")], verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [createBoldText("Sangat Baik")], verticalAlign: VerticalAlign.CENTER }),
            ]
        })
    ];

    if (project.assessmentRubrics && project.assessmentRubrics.length > 0) {
        project.assessmentRubrics.forEach(dimGroup => {
            dimGroup.rubrics.forEach((rubric, index) => {
                assessmentRows.push(new TableRow({
                    children: [
                        new TableCell({ children: [createText(index === 0 ? dimGroup.dimensionName : "")] }),
                        new TableCell({ children: [createText(rubric.aspect)] }),
                        new TableCell({ children: [createText(rubric.score1)] }),
                        new TableCell({ children: [createText(rubric.score2)] }),
                        new TableCell({ children: [createText(rubric.score3)] }),
                        new TableCell({ children: [createText(rubric.score4)] }),
                    ]
                }));
            });
        });
    } else {
        // Fallback row
        assessmentRows.push(new TableRow({
            children: [
                 new TableCell({ children: [createText("-")] }), 
                 new TableCell({ children: [createText("-")] }),
                 new TableCell({ children: [createText("")] }), 
                 new TableCell({ children: [createText("")] }),
                 new TableCell({ children: [createText("")] }), 
                 new TableCell({ children: [createText("")] })
            ]
        }));
    }

    const doc = new Document({
        styles: {
            paragraphStyles: [{
                id: "Normal",
                name: "Normal",
                run: { font: "Times New Roman", size: 24 }, // Size 24 = 12pt
                paragraph: { spacing: { line: 360 } } // 1.5 Spacing (240 = 1 line, 360 = 1.5)
            }]
        },
        sections: [{
            properties: {
                page: {
                    size: {
                        orientation: PageOrientation.PORTRAIT,
                        width: 11906, // A4 Width in Twips
                        height: 16838, // A4 Height in Twips
                    },
                    margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 1 inch margins
                }
            },
            children: [
                // TITLE
                new Paragraph({
                    text: "MODUL PROJEK",
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    run: { font: "Times New Roman", bold: true, size: 28 },
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    text: project.schoolName.toUpperCase(),
                    heading: HeadingLevel.HEADING_2,
                    alignment: AlignmentType.CENTER,
                    run: { font: "Times New Roman", bold: true, size: 28 },
                    spacing: { after: 400 }
                }),

                // TABLE 1: IDENTITAS PROJEK
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: tableBorder,
                    rows: [
                        createHeaderRow("Identitas Projek"),
                        createRow("Tema Projek", project.selectedTheme),
                        createRow("Ide Projek", project.title === "MODUL PROJEK" ? "-" : project.title),
                        createRow("Kelas", project.targetClass),
                        createRow("Alokasi Waktu (JP)", `${project.projectJpAllocation} JP`),
                        createRow("Lokasi Kegiatan", locationString),
                    ],
                }),
                new Paragraph({ text: "" }),

                // TABLE 2: DESKRIPSI SINGKAT
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: tableBorder,
                    rows: [
                        createHeaderRow("Deskripsi Singkat Projek"),
                        new TableRow({
                            children: [
                                new TableCell({
                                    columnSpan: 2,
                                    children: [new Paragraph({ 
                                        children: [new TextRun({ text: fullDescription, font: "Times New Roman", size: 24 })],
                                        spacing: { before: 100, after: 100 }
                                    })]
                                })
                            ]
                        })
                    ]
                }),
                new Paragraph({ text: "" }),

                // TABLE 3: DETAIL PROJEK
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: tableBorder,
                    rows: [
                        createRow("Dimensi Profil Lulusan", project.selectedDimensions.join(", ")),
                        createRow("Tujuan Projek", goalsList),
                        createRow("Praktik Pedagogis", project.pedagogicalStrategy),
                        createRow("Lingkungan Belajar", project.learningEnvironment),
                        createRow("Kemitraan Belajar", project.partnerships || "-"),
                        createRow("Pemanfaatan Digital", project.digitalTools),
                    ],
                }),
                new Paragraph({ text: "" }),

                // TABLE 4: KEGIATAN PROJEK
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: tableBorder,
                    rows: [
                        createHeaderRow("Kegiatan Projek"),
                        new TableRow({
                            children: [
                                new TableCell({
                                    columnSpan: 2,
                                    children: activityParagraphs.length > 0 ? activityParagraphs : [new Paragraph("-")]
                                })
                            ]
                        })
                    ]
                }),
                new Paragraph({ text: "" }),

                // TABLE 5: ASESMEN PROJEK
                new Paragraph({
                    text: "Asesmen Projek",
                    alignment: AlignmentType.CENTER,
                    run: { font: "Times New Roman", bold: true, size: 24 },
                    spacing: { after: 100 }
                }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: tableBorder,
                    rows: assessmentRows
                }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),

                // SIGNATURES
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        createText("Mengetahui,"),
                                        createText("Kepala Sekolah"),
                                        new Paragraph({ text: "" }), new Paragraph({ text: "" }), new Paragraph({ text: "" }),
                                        createBoldText(project.principalName || "........................."),
                                        createText(`NIP. ${project.principalNip || "........................."}`),
                                    ]
                                }),
                                new TableCell({
                                    children: [
                                        createText(`${project.signaturePlace}, ${formatDateIndo(project.signatureDate)}`),
                                        createText("Koordinator Projek"),
                                        new Paragraph({ text: "" }), new Paragraph({ text: "" }), new Paragraph({ text: "" }),
                                        createBoldText(project.coordinatorName || "........................."),
                                        createText(`NIP. ${project.coordinatorNip || "........................."}`),
                                    ]
                                })
                            ]
                        })
                    ]
                })
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    const saveAs = (FileSaver as any).saveAs || FileSaver; 
    saveAs(blob, `Modul_Projek_${project.selectedTheme.replace(/\s+/g, '_')}.docx`);
};

// --- PROGRAM TAHUNAN (Annual Program) ---
export const generateAnnualProgramDocx = async (primaryProject: ProjectState, relatedProjects: ProjectState[]) => {
    // Combine projects
    const allProjects = [...relatedProjects];
    if (!allProjects.find(p => p.id === primaryProject.id)) {
        allProjects.push(primaryProject);
    }

    // Totals
    const totalAllocated = allProjects.reduce((acc, p) => acc + p.projectJpAllocation, 0);
    const totalAnnual = primaryProject.totalJpAnnual; 
    const remaining = Math.max(0, totalAnnual - totalAllocated);

    // Common Cell (returning TableCell)
    // Fix: Explicitly type alignment to avoid narrowing to 'left' literal
    const cell = (text: string, bold = false, align: any = AlignmentType.LEFT) => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold, font: "Times New Roman", size: 24 })], alignment: align })],
        verticalAlign: VerticalAlign.CENTER,
    });

    // Helper for paragraphs (returning Paragraph)
    // Fix: Explicitly type alignment to avoid narrowing to 'left' literal
    const para = (text: string, bold = false, align: any = AlignmentType.LEFT) => new Paragraph({
        children: [new TextRun({ text, bold, font: "Times New Roman", size: 24 })], 
        alignment: align
    });

    const projectRows = allProjects.map((proj, index) => {
        const activitiesText = proj.activities.map((a, i) => `${i + 1}. ${a.name}`).join("\n");
        const allSubjects = Array.from(new Set(proj.projectGoals.flatMap(g => g.subjects))).join(", ");

        return new TableRow({
            children: [
                cell(`${index + 1}`, false, AlignmentType.CENTER),
                cell(proj.targetClass || "-"),
                cell(proj.selectedDimensions.join(", ")),
                cell(proj.selectedTheme),
                cell(proj.activityFormat),
                cell(activitiesText), 
                cell(allSubjects || proj.integratedSubjects || "-"),
                cell(`${proj.projectJpAllocation} JP`, false, AlignmentType.CENTER),
            ]
        });
    });

    const doc = new Document({
        styles: {
            paragraphStyles: [{
                id: "Normal",
                name: "Normal",
                run: { font: "Times New Roman", size: 24 },
                paragraph: { spacing: { line: 360 } }
            }]
        },
        sections: [{
            properties: {
                page: {
                    size: {
                        orientation: PageOrientation.LANDSCAPE,
                        width: 16838,
                        height: 11906,
                    },
                    margin: { top: 720, right: 720, bottom: 720, left: 720 }
                }
            },
            children: [
                new Paragraph({
                    text: "PROGRAM TAHUNAN PROJEK KOKURIKULER",
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    run: { font: "Times New Roman", bold: true, size: 28 },
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    text: `KELAS ${primaryProject.targetClass || "..."} - ${primaryProject.schoolName.toUpperCase()}`,
                    heading: HeadingLevel.HEADING_2,
                    alignment: AlignmentType.CENTER,
                    run: { font: "Times New Roman", bold: true, size: 24 },
                    spacing: { after: 400 }
                }),

                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: tableBorder,
                    rows: [
                        new TableRow({
                            tableHeader: true,
                            children: [
                                cell("No", true, AlignmentType.CENTER),
                                cell("Kelas", true, AlignmentType.CENTER),
                                cell("Dimensi Profil", true, AlignmentType.CENTER),
                                cell("Tema", true, AlignmentType.CENTER),
                                cell("Bentuk Kegiatan", true, AlignmentType.CENTER),
                                cell("Poin Aktivitas", true, AlignmentType.CENTER),
                                cell("Mata Pelajaran", true, AlignmentType.CENTER),
                                cell("Alokasi JP", true, AlignmentType.CENTER),
                            ]
                        }),
                        ...projectRows,
                        new TableRow({
                            children: [
                                new TableCell({ columnSpan: 7, children: [new Paragraph({ text: "Total Alokasi Waktu Terpakai", alignment: AlignmentType.RIGHT, run: { bold: true, font: "Times New Roman" } })] }),
                                cell(`${totalAllocated} JP`, true, AlignmentType.CENTER),
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ columnSpan: 7, children: [new Paragraph({ text: "Total Beban Belajar Tahunan", alignment: AlignmentType.RIGHT, run: { bold: true, font: "Times New Roman" } })] }),
                                cell(`${totalAnnual} JP`, true, AlignmentType.CENTER),
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ columnSpan: 7, children: [new Paragraph({ text: "Sisa Waktu", alignment: AlignmentType.RIGHT, run: { bold: true, font: "Times New Roman" } })] }),
                                cell(`${remaining} JP`, true, AlignmentType.CENTER),
                            ]
                        })
                    ]
                }),

                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),

                // Signatures
                 new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    children: [
                                        para("Mengetahui,"),
                                        para("Kepala Sekolah"),
                                        new Paragraph({ text: "" }), new Paragraph({ text: "" }),
                                        para(primaryProject.principalName || ".........................", true),
                                        para(`NIP. ${primaryProject.principalNip || "........................."}`),
                                    ]
                                }),
                                new TableCell({
                                    children: [
                                        para(`${primaryProject.signaturePlace}, ${formatDateIndo(primaryProject.signatureDate)}`),
                                        para("Koordinator Projek"),
                                        new Paragraph({ text: "" }), new Paragraph({ text: "" }),
                                        para(primaryProject.coordinatorName || ".........................", true),
                                        para(`NIP. ${primaryProject.coordinatorNip || "........................."}`),
                                    ]
                                })
                            ]
                        })
                    ]
                })
            ]
        }]
    });

    const blob = await Packer.toBlob(doc);
    const saveAs = (FileSaver as any).saveAs || FileSaver; 
    saveAs(blob, `Program_Tahunan_Kelas_${primaryProject.targetClass.replace(/\s+/g, '_')}.docx`);
}
