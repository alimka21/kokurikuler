
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

// Common Border Style
const tableBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
};

// Common Cell Margins (Padding) - INCREASED for better readability
const defaultCellMargin = {
    top: 144,    // ~2.5mm
    bottom: 144, // ~2.5mm
    left: 144,   // ~2.5mm
    right: 144   // ~2.5mm
};

// Helper for Alphabet Indexing (0 -> A, 1 -> B, etc.)
const getAlphabetIndex = (index: number) => {
    return String.fromCharCode(65 + index); // 65 is 'A'
};

// Helper: Convert string with newlines to Bullet List Paragraphs (Simple Bullet)
const formatListToParagraphs = (text: string | undefined): Paragraph[] => {
    if (!text) return [new Paragraph({ children: [new TextRun({ text: "-", font: "Times New Roman", size: 24 })] })];
    
    // Split by newline and filter empty strings
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length === 0) return [new Paragraph({ children: [new TextRun({ text: "-", font: "Times New Roman", size: 24 })] })];

    // Check if it looks like a list (contains - or 1.) or just assume newlines = list
    return lines.map(line => {
        // Clean leading indicators like "- ", "* ", "1. " if present to avoid double bullets
        const cleanLine = line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        
        return new Paragraph({
            children: [new TextRun({ text: cleanLine, font: "Times New Roman", size: 24 })],
            bullet: { level: 0 } // Create actual docx bullet
        });
    });
};

// Helper: Convert Array of Strings to Numbered List Paragraphs
const formatArrayToNumberedList = (items: string[] | undefined): Paragraph[] => {
    if (!items || items.length === 0) {
        return [new Paragraph({ children: [new TextRun({ text: "-", font: "Times New Roman", size: 24 })] })];
    }

    return items.map((item, i) => new Paragraph({
        children: [new TextRun({ text: `${i + 1}. ${item}`, font: "Times New Roman", size: 24 })],
        spacing: { after: 120 }
    }));
};

// --- MODUL PROJEK (Single Project) ---
export const generateAndDownloadDocx = async (project: ProjectState) => {
    
    // 1. Prepare Content Helpers
    const createBoldText = (text: string) => new Paragraph({ children: [new TextRun({ text, bold: true, font: "Times New Roman", size: 24 })], alignment: AlignmentType.CENTER });
    
    const createText = (text: string, align: any = AlignmentType.LEFT) => new Paragraph({ 
        children: [new TextRun({ text, font: "Times New Roman", size: 24 })], 
        alignment: align 
    });

    const createCenteredText = (text: string) => new Paragraph({ 
        children: [new TextRun({ text, font: "Times New Roman", size: 24 })], 
        alignment: AlignmentType.CENTER
    });
    
    const createCenteredBoldText = (text: string) => new Paragraph({ 
        children: [new TextRun({ text, font: "Times New Roman", size: 24, bold: true })], 
        alignment: AlignmentType.CENTER
    });

    // Helper: Create a standard label-value row for the main tables
    const createRow = (label: string, content: string | Paragraph[]) => {
        let contentChildren: Paragraph[] = [];
        
        if (typeof content === 'string') {
            contentChildren = [new Paragraph({ children: [new TextRun({ text: content || "-", font: "Times New Roman", size: 24 })] })];
        } else {
            contentChildren = content;
        }

        return new TableRow({
            children: [
                new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, font: "Times New Roman", size: 24 })] })],
                    verticalAlign: VerticalAlign.TOP,
                    margins: defaultCellMargin,
                }),
                new TableCell({
                     width: { size: 70, type: WidthType.PERCENTAGE },
                     children: contentChildren,
                     verticalAlign: VerticalAlign.TOP,
                     margins: defaultCellMargin,
                }),
            ]
        });
    };

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
                margins: defaultCellMargin,
            })
        ]
    });

    // --- DATA PROCESSING ---

    // 1. Dimensions (Numbered List)
    const dimensionParagraphs = formatArrayToNumberedList(project.selectedDimensions);

    // 2. Goals (Numbered List)
    const goalParagraphs = project.projectGoals.length > 0
        ? project.projectGoals.map((g, i) => new Paragraph({
            children: [new TextRun({ text: `${i + 1}. ${g.description}`, font: "Times New Roman", size: 24 })],
            spacing: { after: 120 }
        }))
        : [new Paragraph({ children: [new TextRun({ text: "-", font: "Times New Roman", size: 24 })] })];

    // 3. Location (Numbered List)
    const locationParagraphs = formatArrayToNumberedList(project.activityLocations);

    // 4. Subjects (Unique & Numbered)
    const uniqueSubjects = Array.from(new Set(project.projectGoals.flatMap(g => g.subjects)));
    const subjectParagraphs = formatArrayToNumberedList(uniqueSubjects);

    // 5. Full Description (Simplified: NO Context Analysis)
    const fullDescription = project.projectDescription || "Belum ada deskripsi.";

    // 6. Activities List (Formatted like PDF: A. Title (JP) -> 1. Steps...)
    const activityParagraphs: Paragraph[] = [];
    
    project.activities.forEach((act, i) => {
        // A. Header Row (Bold)
        const alphabet = getAlphabetIndex(i);
        activityParagraphs.push(new Paragraph({ 
            children: [new TextRun({ text: `${alphabet}. ${act.name} (${act.jp} JP)`, font: "Times New Roman", size: 24, bold: true })],
            spacing: { before: 240, after: 120 }
        }));
        
        // Detailed Steps (Numbered List)
        if (act.steps && act.steps.length > 0) {
            act.steps.forEach((step, stepIdx) => {
                // Remove existing numbering if AI included it (e.g., "1. Guru...")
                const cleanStep = step.replace(/^\d+[\.\)]\s*/, '');
                
                activityParagraphs.push(new Paragraph({
                    children: [new TextRun({ text: `${stepIdx + 1}. ${cleanStep}`, font: "Times New Roman", size: 24 })],
                    indent: { left: 360 }, // Indent to align with text above
                    spacing: { after: 60 }
                }));
            });
        } else {
            // Fallback if steps not generated yet or empty
            activityParagraphs.push(new Paragraph({
                children: [new TextRun({ text: act.description || "Belum ada rincian.", font: "Times New Roman", size: 24 })],
                indent: { left: 360 }, 
                spacing: { after: 120 }
            }));
        }
    });

    if (activityParagraphs.length === 0) activityParagraphs.push(new Paragraph("-"));

    // 7. Assessment Rows (Fixed Order: Dimension | Aspect | SB | B | C | K)
    const assessmentRows: TableRow[] = [
        new TableRow({
            tableHeader: true,
            children: [
                new TableCell({ children: [createBoldText("Dimensi")], verticalAlign: VerticalAlign.CENTER, margins: defaultCellMargin, shading: { fill: "E2E8F0" } }),
                new TableCell({ children: [createBoldText("Aspek")], verticalAlign: VerticalAlign.CENTER, margins: defaultCellMargin, shading: { fill: "E2E8F0" } }),
                new TableCell({ children: [createBoldText("Sangat Baik")], verticalAlign: VerticalAlign.CENTER, margins: defaultCellMargin, shading: { fill: "E2E8F0" } }),
                new TableCell({ children: [createBoldText("Baik")], verticalAlign: VerticalAlign.CENTER, margins: defaultCellMargin, shading: { fill: "E2E8F0" } }),
                new TableCell({ children: [createBoldText("Cukup")], verticalAlign: VerticalAlign.CENTER, margins: defaultCellMargin, shading: { fill: "E2E8F0" } }),
                new TableCell({ children: [createBoldText("Kurang")], verticalAlign: VerticalAlign.CENTER, margins: defaultCellMargin, shading: { fill: "E2E8F0" } }),
            ]
        })
    ];

    if (project.assessmentRubrics && project.assessmentRubrics.length > 0) {
        project.assessmentRubrics.forEach(dimGroup => {
            dimGroup.rubrics.forEach((rubric, index) => {
                assessmentRows.push(new TableRow({
                    children: [
                        new TableCell({ children: [createText(index === 0 ? dimGroup.dimensionName : "")], margins: defaultCellMargin }),
                        new TableCell({ children: [createText(rubric.aspect)], margins: defaultCellMargin }),
                        new TableCell({ children: [createText(rubric.score4)], margins: defaultCellMargin }), // Sangat Baik
                        new TableCell({ children: [createText(rubric.score3)], margins: defaultCellMargin }), // Baik
                        new TableCell({ children: [createText(rubric.score2)], margins: defaultCellMargin }), // Cukup
                        new TableCell({ children: [createText(rubric.score1)], margins: defaultCellMargin }), // Kurang
                    ]
                }));
            });
        });
    } else {
        // Fallback row
        assessmentRows.push(new TableRow({
            children: [
                 new TableCell({ children: [createText("-")], margins: defaultCellMargin }), 
                 new TableCell({ children: [createText("-")], margins: defaultCellMargin }),
                 new TableCell({ children: [createText("")], margins: defaultCellMargin }), 
                 new TableCell({ children: [createText("")], margins: defaultCellMargin }),
                 new TableCell({ children: [createText("")], margins: defaultCellMargin }), 
                 new TableCell({ children: [createText("")], margins: defaultCellMargin })
            ]
        }));
    }

    const doc = new Document({
        styles: {
            paragraphStyles: [{
                id: "Normal",
                name: "Normal",
                run: { font: "Times New Roman", size: 24 }, // Size 24 = 12pt
                paragraph: { spacing: { line: 360 } } // 1.5 Spacing
            }]
        },
        sections: [{
            properties: {
                page: {
                    size: {
                        orientation: PageOrientation.PORTRAIT,
                        width: 11906, // A4 Width
                        height: 16838, // A4 Height
                    },
                    margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
                }
            },
            children: [
                // TITLE (18pt = 36 half-points, Bold, Black)
                new Paragraph({
                    text: "MODUL PROJEK",
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    run: { font: "Times New Roman", bold: true, size: 36, color: "000000" }, // 18pt
                    spacing: { after: 100 }
                }),
                // SCHOOL NAME (14pt = 28 half-points, Black)
                new Paragraph({
                    text: project.schoolName.toUpperCase(),
                    heading: HeadingLevel.HEADING_2,
                    alignment: AlignmentType.CENTER,
                    run: { font: "Times New Roman", size: 28, color: "000000" }, // 14pt (Not bold per request)
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
                        createRow("Mata Pelajaran Terkait", subjectParagraphs),
                        createRow("Lokasi Kegiatan", locationParagraphs),
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
                                        spacing: { before: 120, after: 120 }
                                    })],
                                    margins: defaultCellMargin
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
                        createRow("Dimensi Profil Lulusan", dimensionParagraphs),
                        createRow("Tujuan Projek", goalParagraphs),
                        createRow("Praktik Pedagogis", formatListToParagraphs(project.pedagogicalStrategy)),
                        createRow("Lingkungan Belajar", formatListToParagraphs(project.learningEnvironment)),
                        createRow("Kemitraan Belajar", formatListToParagraphs(project.partnerships)),
                        createRow("Pemanfaatan Digital", formatListToParagraphs(project.digitalTools)),
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
                                    children: activityParagraphs,
                                    margins: defaultCellMargin
                                })
                            ]
                        })
                    ]
                }),
                new Paragraph({ text: "" }),

                // TABLE 5: ASESMEN PROJEK (14pt Bold Header, Black)
                new Paragraph({
                    text: "Asesmen Projek",
                    alignment: AlignmentType.CENTER,
                    run: { font: "Times New Roman", bold: true, size: 28, color: "000000" }, // 14pt
                    spacing: { after: 100 }
                }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: tableBorder,
                    rows: assessmentRows
                }),
                new Paragraph({ text: "" }),
                new Paragraph({ text: "" }),

                // SIGNATURES (50% - 50% split, All Centered)
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    children: [
                                        createCenteredText("Mengetahui,"),
                                        createCenteredText("Kepala Sekolah"),
                                        new Paragraph({ text: "" }), new Paragraph({ text: "" }), new Paragraph({ text: "" }),
                                        createCenteredBoldText(project.principalName || "........................."),
                                        createCenteredText(`NIP. ${project.principalNip || "........................."}`),
                                    ],
                                    margins: defaultCellMargin
                                }),
                                new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    children: [
                                        createCenteredText(`${project.signaturePlace}, ${formatDateIndo(project.signatureDate)}`),
                                        createCenteredText("Koordinator Projek"),
                                        new Paragraph({ text: "" }), new Paragraph({ text: "" }), new Paragraph({ text: "" }),
                                        createCenteredBoldText(project.coordinatorName || "........................."),
                                        createCenteredText(`NIP. ${project.coordinatorNip || "........................."}`),
                                    ],
                                    margins: defaultCellMargin
                                })
                            ]
                        })
                    ]
                })
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    const saveAs = (FileSaver && (FileSaver as any).saveAs) ? (FileSaver as any).saveAs : FileSaver;
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

    const cell = (text: string, bold = false, align: any = AlignmentType.LEFT) => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold, font: "Times New Roman", size: 24 })], alignment: align })],
        verticalAlign: VerticalAlign.CENTER,
        margins: defaultCellMargin,
    });

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
                                new TableCell({ columnSpan: 7, margins: defaultCellMargin, children: [new Paragraph({ text: "Total Alokasi Waktu Terpakai", alignment: AlignmentType.RIGHT, run: { bold: true, font: "Times New Roman" } })] }),
                                cell(`${totalAllocated} JP`, true, AlignmentType.CENTER),
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ columnSpan: 7, margins: defaultCellMargin, children: [new Paragraph({ text: "Total Beban Belajar Tahunan", alignment: AlignmentType.RIGHT, run: { bold: true, font: "Times New Roman" } })] }),
                                cell(`${totalAnnual} JP`, true, AlignmentType.CENTER),
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ columnSpan: 7, margins: defaultCellMargin, children: [new Paragraph({ text: "Sisa Waktu", alignment: AlignmentType.RIGHT, run: { bold: true, font: "Times New Roman" } })] }),
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
                                    ],
                                    margins: defaultCellMargin
                                }),
                                new TableCell({
                                    children: [
                                        para(`${primaryProject.signaturePlace}, ${formatDateIndo(primaryProject.signatureDate)}`),
                                        para("Koordinator Projek"),
                                        new Paragraph({ text: "" }), new Paragraph({ text: "" }),
                                        para(primaryProject.coordinatorName || ".........................", true),
                                        para(`NIP. ${primaryProject.coordinatorNip || "........................."}`),
                                    ],
                                    margins: defaultCellMargin
                                })
                            ]
                        })
                    ]
                })
            ]
        }]
    });

    const blob = await Packer.toBlob(doc);
    const saveAs = (FileSaver && (FileSaver as any).saveAs) ? (FileSaver as any).saveAs : FileSaver;
    saveAs(blob, `Program_Tahunan_${primaryProject.selectedTheme.replace(/\s+/g, '_')}.docx`);
}
