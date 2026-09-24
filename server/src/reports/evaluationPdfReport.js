import PDFDocument from "pdfkit";

const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 42,
  contentWidth: 511.28,
  top: 76,
  bottom: 56,
};

const COLORS = {
  navy: "#223858",
  blue: "#4e82b7",
  blueDark: "#35638f",
  blueLight: "#e7f0fa",
  border: "#d8e3f0",
  text: "#263c5e",
  muted: "#647a99",
  surface: "#ffffff",
  page: "#f7f9fc",
  excellent: "#237359",
  excellentBg: "#e5f3ee",
  good: "#35638f",
  goodBg: "#e7f0fa",
  needsImprovement: "#99691f",
  needsImprovementBg: "#fff1d3",
  poor: "#b34a4a",
  poorBg: "#fbe9e9",
  low: "#237359",
  lowBg: "#e5f3ee",
  moderate: "#99691f",
  moderateBg: "#fff1d3",
  high: "#b34a4a",
  highBg: "#fbe9e9",
  critical: "#b34a4a",
  criticalBg: "#fbe9e9",
};

const RATING_ORDER = [
  "EXCELLENT",
  "GOOD",
  "NEEDS_IMPROVEMENT",
  "POOR",
];

const RISK_ORDER = [
  "LOW",
  "MODERATE",
  "HIGH",
  "CRITICAL",
];

const RATING_STYLE = {
  EXCELLENT: {
    label: "Excellent",
    color: COLORS.excellent,
    background: COLORS.excellentBg,
  },
  GOOD: {
    label: "Good",
    color: COLORS.good,
    background: COLORS.goodBg,
  },
  NEEDS_IMPROVEMENT: {
    label: "Needs Improvement",
    color: COLORS.needsImprovement,
    background: COLORS.needsImprovementBg,
  },
  POOR: {
    label: "Poor",
    color: COLORS.poor,
    background: COLORS.poorBg,
  },
};

const RISK_STYLE = {
  LOW: {
    label: "Low",
    color: COLORS.low,
    background: COLORS.lowBg,
  },
  MODERATE: {
    label: "Moderate",
    color: COLORS.moderate,
    background: COLORS.moderateBg,
  },
  HIGH: {
    label: "High",
    color: COLORS.high,
    background: COLORS.highBg,
  },
  CRITICAL: {
    label: "Critical",
    color: COLORS.critical,
    background: COLORS.criticalBg,
  },
};

function asDate(value) {
  if (!value) return null;
  const date = value instanceof Date
    ? value
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value) {
  const date = asDate(value);
  if (!date) return "Unavailable";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
    timeZoneName: "short",
  })
    .format(date)
    .replace(/\b(am|pm)\b/g, (period) =>
      period.toUpperCase()
    );
}

function formatPeriod(year, quarter) {
  if (year && quarter) return `Q${quarter} ${year}`;
  if (year) return `All quarters, ${year}`;
  if (quarter) return `Q${quarter}, all years`;
  return "All reporting periods";
}

function displayText(value, fallback = "Unavailable") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildCriteriaGroups(evaluations) {
  const groups = new Map();

  evaluations.forEach((evaluation) => {
    const key = displayText(
      evaluation.criteriaSignature,
      "unspecified"
    );

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(evaluation);
  });

  return Array.from(groups.values()).map(
    (groupEvaluations, groupIndex) => {
      const kpis = new Map();

      groupEvaluations.forEach((evaluation) => {
        (evaluation.scores ?? []).forEach(
          (score, scoreIndex) => {
            const key = String(
              score.kpiId ??
                `${score.kpiNameSnapshot}-${scoreIndex}`
            );
            const current = kpis.get(key) ?? {
              name: displayText(
                score.kpiNameSnapshot,
                "Unnamed KPI"
              ),
              weight: number(score.weightSnapshot),
              scores: [],
              order: scoreIndex,
            };
            current.scores.push(number(score.score));
            kpis.set(key, current);
          }
        );
      });

      return {
        label: `Criteria configuration ${
          groupIndex + 1
        }`,
        evaluationCount: groupEvaluations.length,
        kpis: Array.from(kpis.values())
          .sort((left, right) =>
            left.order - right.order
          )
          .map((kpi) => ({
            name: kpi.name,
            weight: kpi.weight,
            averageScore:
              kpi.scores.reduce(
                (sum, score) => sum + score,
                0
              ) / kpi.scores.length,
          })),
      };
    }
  );
}

export function buildEvaluationPdfReportModel(
  { evaluations = [], scope = {} },
  { generatedAt = new Date() } = {}
) {
  const safeEvaluations = evaluations.map(
    (evaluation) => ({
      supplierName: displayText(
        evaluation.supplierId?.supplierName,
        "Unavailable supplier"
      ),
      supplierCategory: displayText(
        evaluation.supplierId?.category,
        "Not provided"
      ),
      year: number(evaluation.year),
      quarter: number(evaluation.quarter),
      overallScore: number(evaluation.overallScore),
      performanceRating: displayText(
        evaluation.performanceRating,
        "UNAVAILABLE"
      ),
      riskLevel: displayText(
        evaluation.riskLevel,
        "UNAVAILABLE"
      ),
      evaluatorName: displayText(
        evaluation.evaluatorId?.name
      ),
      submittedAt: asDate(evaluation.createdAt),
      overallComments:
        String(evaluation.comments ?? "").trim() ||
        null,
      scores: (evaluation.scores ?? []).map(
        (score) => ({
          name: displayText(
            score.kpiNameSnapshot,
            "Unnamed KPI"
          ),
          weight: number(score.weightSnapshot),
          score: number(score.score),
          comment:
            String(score.comment ?? "").trim() ||
            null,
        })
      ),
    })
  );

  const ratingDistribution = Object.fromEntries(
    RATING_ORDER.map((rating) => [rating, 0])
  );
  const riskDistribution = Object.fromEntries(
    RISK_ORDER.map((risk) => [risk, 0])
  );

  safeEvaluations.forEach((evaluation) => {
    if (
      Object.hasOwn(
        ratingDistribution,
        evaluation.performanceRating
      )
    ) {
      ratingDistribution[
        evaluation.performanceRating
      ] += 1;
    }
    if (
      Object.hasOwn(
        riskDistribution,
        evaluation.riskLevel
      )
    ) {
      riskDistribution[evaluation.riskLevel] += 1;
    }
  });

  const supplierKeys = new Set(
    evaluations.map((evaluation, index) =>
      String(
        evaluation.supplierId?._id ??
          evaluation.supplierId ??
          `${safeEvaluations[index].supplierName}\u0000${
            safeEvaluations[index].supplierCategory
          }`
      )
    )
  );

  return {
    title: "Supplier Performance Report",
    generatedAt: asDate(generatedAt) ?? new Date(),
    scope: {
      period: formatPeriod(scope.year, scope.quarter),
      supplier: scope.supplierName
        ? displayText(scope.supplierName)
        : "All suppliers",
    },
    summary: {
      evaluationCount: safeEvaluations.length,
      supplierCount: supplierKeys.size,
      averageScore: safeEvaluations.length
        ? safeEvaluations.reduce(
            (sum, evaluation) =>
              sum + evaluation.overallScore,
            0
          ) / safeEvaluations.length
        : null,
      highCriticalRiskCount:
        (riskDistribution.HIGH ?? 0) +
        (riskDistribution.CRITICAL ?? 0),
    },
    ratingDistribution,
    riskDistribution,
    supplierPerformance: [...safeEvaluations].sort(
      (left, right) =>
        right.overallScore - left.overallScore ||
        left.supplierName.localeCompare(
          right.supplierName
        )
    ),
    criteriaGroups: buildCriteriaGroups(evaluations),
    evaluations: safeEvaluations,
  };
}

function drawBrand(doc, x, y) {
  doc
    .roundedRect(x, y, 31, 31, 7)
    .fill(COLORS.navy)
    .fillColor(COLORS.surface)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("VP", x, y + 10, {
      width: 31,
      align: "center",
    });

  doc
    .fillColor(COLORS.navy)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("Vendor", x + 39, y + 7, {
      continued: true,
    })
    .fillColor(COLORS.blue)
    .text("Pulse");
}

function drawFirstPageHeader(doc, model) {
  doc.rect(0, 0, PAGE.width, 184).fill(COLORS.page);
  doc
    .rect(0, 0, 8, 184)
    .fill(COLORS.blue);

  drawBrand(doc, PAGE.margin, 32);
  doc
    .fillColor(COLORS.navy)
    .font("Helvetica-Bold")
    .fontSize(24)
    .text(model.title, PAGE.margin, 86, {
      width: PAGE.contentWidth,
    });
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(9)
    .text(
      `Reporting period: ${model.scope.period}`,
      PAGE.margin,
      126
    )
    .text(
      `Supplier scope: ${model.scope.supplier}`,
      PAGE.margin,
      141,
      { width: 300 }
    )
    .text(
      `Generated: ${formatDateTime(
        model.generatedAt
      )}`,
      350,
      126,
      { width: 203, align: "right" }
    );
  doc.y = 208;
}

function drawRunningHeader(doc, model) {
  doc
    .fillColor(COLORS.navy)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(
      "VendorPulse",
      PAGE.margin,
      28,
      { width: 130 }
    );
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(8)
    .text(
      `${model.title} / ${model.scope.period}`,
      170,
      29,
      { width: 383, align: "right" }
    );
  doc
    .moveTo(PAGE.margin, 48)
    .lineTo(PAGE.width - PAGE.margin, 48)
    .strokeColor(COLORS.border)
    .lineWidth(0.8)
    .stroke();
  doc.y = PAGE.top;
}

function sectionHeading(doc, title, subtitle) {
  doc
    .fillColor(COLORS.navy)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(title, PAGE.margin, doc.y, {
      width: PAGE.contentWidth,
    });
  if (subtitle) {
    doc
      .fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(8.5)
      .text(subtitle, PAGE.margin, doc.y + 5, {
        width: PAGE.contentWidth,
        lineGap: 2,
      });
  }
  doc.y += 15;
}

function drawSummaryCards(doc, model) {
  const gap = 10;
  const width =
    (PAGE.contentWidth - gap * 3) / 4;
  const y = doc.y;
  const cards = [
    [
      "Evaluations included",
      String(model.summary.evaluationCount),
      "Filtered records",
    ],
    [
      "Suppliers evaluated",
      String(model.summary.supplierCount),
      "Distinct suppliers",
    ],
    [
      "Average overall score",
      model.summary.averageScore.toFixed(2),
      "Included evaluations / 5",
    ],
    [
      "High / critical risk",
      String(model.summary.highCriticalRiskCount),
      "Evaluations requiring attention",
    ],
  ];

  cards.forEach((card, index) => {
    const x = PAGE.margin + index * (width + gap);
    doc
      .roundedRect(x, y, width, 77, 7)
      .fillAndStroke(
        COLORS.surface,
        COLORS.border
      );
    doc
      .fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(7.5)
      .text(card[0], x + 10, y + 11, {
        width: width - 20,
        height: 17,
      });
    doc
      .fillColor(COLORS.navy)
      .font("Helvetica-Bold")
      .fontSize(19)
      .text(card[1], x + 10, y + 31, {
        width: width - 20,
      });
    doc
      .fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(6.5)
      .text(card[2], x + 10, y + 58, {
        width: width - 20,
      });
  });
  doc.y = y + 97;
}

function drawDistributionPanel(
  doc,
  { x, y, width, title, order, styles, counts }
) {
  const total = Object.values(counts).reduce(
    (sum, count) => sum + count,
    0
  );
  const maxCount = Math.max(
    ...Object.values(counts),
    1
  );

  doc
    .roundedRect(x, y, width, 137, 7)
    .fillAndStroke(COLORS.surface, COLORS.border);
  doc
    .fillColor(COLORS.navy)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(title, x + 12, y + 12, {
      width: width - 24,
    });

  order.forEach((key, index) => {
    const style = styles[key];
    const count = counts[key] ?? 0;
    const rowY = y + 38 + index * 22;
    const labelWidth = 88;
    const barX = x + 12 + labelWidth;
    const barWidth = width - labelWidth - 50;
    doc
      .fillColor(COLORS.text)
      .font("Helvetica")
      .fontSize(7.5)
      .text(style.label, x + 12, rowY, {
        width: labelWidth - 6,
      });
    doc
      .roundedRect(barX, rowY + 1, barWidth, 7, 3.5)
      .fill(style.background);
    if (count > 0) {
      doc
        .roundedRect(
          barX,
          rowY + 1,
          Math.max(5, (count / maxCount) * barWidth),
          7,
          3.5
        )
        .fill(style.color);
    }
    doc
      .fillColor(style.color)
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .text(
        `${count}${total ? ` / ${total}` : ""}`,
        x + width - 34,
        rowY,
        { width: 22, align: "right" }
      );
  });
}

function drawDistributionSection(doc, model) {
  const gap = 12;
  const width = (PAGE.contentWidth - gap) / 2;
  const y = doc.y;
  drawDistributionPanel(doc, {
    x: PAGE.margin,
    y,
    width,
    title: "Performance rating distribution",
    order: RATING_ORDER,
    styles: RATING_STYLE,
    counts: model.ratingDistribution,
  });
  drawDistributionPanel(doc, {
    x: PAGE.margin + width + gap,
    y,
    width,
    title: "Risk distribution",
    order: RISK_ORDER,
    styles: RISK_STYLE,
    counts: model.riskDistribution,
  });
  doc.y = y + 157;
}

function drawSupplierPerformance(doc, model) {
  const items = model.supplierPerformance.slice(0, 7);
  sectionHeading(
    doc,
    "Supplier Performance",
    "Overall scores from included evaluations. Results are shown without rank or winner designation."
  );

  items.forEach((evaluation) => {
    const y = doc.y;
    const period = `Q${evaluation.quarter} ${evaluation.year}`;
    const showPeriod =
      model.scope.period === "All reporting periods" ||
      model.scope.period.includes("All quarters") ||
      model.scope.period.includes("all years");
    const label = showPeriod
      ? `${evaluation.supplierName} / ${period}`
      : evaluation.supplierName;
    const ratingStyle =
      RATING_STYLE[evaluation.performanceRating] ?? {
        label: evaluation.performanceRating,
        color: COLORS.muted,
      };
    const riskStyle =
      RISK_STYLE[evaluation.riskLevel] ?? {
        label: evaluation.riskLevel,
        color: COLORS.muted,
      };

    doc
      .fillColor(COLORS.text)
      .font("Helvetica")
      .fontSize(7.5)
      .text(label, PAGE.margin, y, {
        width: 162,
        ellipsis: true,
      });
    doc
      .roundedRect(PAGE.margin + 170, y + 1, 190, 8, 4)
      .fill(COLORS.blueLight);
    doc
      .roundedRect(
        PAGE.margin + 170,
        y + 1,
        Math.max(
          6,
          (Math.min(evaluation.overallScore, 5) / 5) *
            190
        ),
        8,
        4
      )
      .fill(COLORS.blue);
    doc
      .fillColor(COLORS.navy)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text(
        evaluation.overallScore.toFixed(2),
        PAGE.margin + 370,
        y,
        { width: 32, align: "right" }
      )
      .fillColor(ratingStyle.color)
      .fontSize(7)
      .text(
        ratingStyle.label,
        PAGE.margin + 410,
        y,
        { width: 58, align: "right" }
      )
      .fillColor(riskStyle.color)
      .text(
        riskStyle.label,
        PAGE.margin + 472,
        y,
        { width: 39, align: "right" }
      );
    doc.y = y + 19;
  });

  if (model.supplierPerformance.length > items.length) {
    doc
      .fillColor(COLORS.muted)
      .font("Helvetica-Oblique")
      .fontSize(7.5)
      .text(
        `${
          model.supplierPerformance.length - items.length
        } additional evaluations continue in Detailed Results.`,
        PAGE.margin,
        doc.y + 2,
        { width: PAGE.contentWidth }
      );
  }
}

function drawEmptyReport(doc, model) {
  drawFirstPageHeader(doc, model);
  doc
    .roundedRect(
      PAGE.margin,
      235,
      PAGE.contentWidth,
      172,
      10
    )
    .fillAndStroke(COLORS.surface, COLORS.border);
  doc
    .circle(PAGE.width / 2, 281, 22)
    .fill(COLORS.blueLight)
    .fillColor(COLORS.blue)
    .font("Helvetica-Bold")
    .fontSize(16)
    .text("-", PAGE.width / 2 - 9, 274, {
      width: 18,
      align: "center",
    });
  doc
    .fillColor(COLORS.navy)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(
      "No evaluations matched the selected filters.",
      PAGE.margin + 30,
      323,
      { width: PAGE.contentWidth - 60, align: "center" }
    );
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(9)
    .text(
      "Adjust the report filters to include submitted evaluation records.",
      PAGE.margin + 45,
      350,
      { width: PAGE.contentWidth - 90, align: "center" }
    );
}

function ensureSpace(doc, model, height) {
  if (doc.y + height <= PAGE.height - PAGE.bottom) {
    return;
  }
  doc.addPage();
}

function drawKpiAnalysis(doc, model) {
  doc.addPage();
  sectionHeading(
    doc,
    "KPI Performance",
    model.criteriaGroups.length > 1
      ? "KPI summaries are separated because the included evaluations used different historical criteria."
      : "KPI names, weights, and scores use the saved historical evaluation snapshots."
  );

  model.criteriaGroups.forEach((group) => {
    const groupHeight = 68 + group.kpis.length * 31;
    ensureSpace(
      doc,
      model,
      Math.min(groupHeight, 230)
    );
    const y = doc.y;
    doc
      .roundedRect(
        PAGE.margin,
        y,
        PAGE.contentWidth,
        42,
        6
      )
      .fill(COLORS.blueLight);
    doc
      .fillColor(COLORS.navy)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(group.label, PAGE.margin + 12, y + 9, {
        width: 270,
      });
    doc
      .fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(7.5)
      .text(
        group.evaluationCount === 1
          ? "Individual KPI breakdown for 1 evaluation"
          : `Average across ${group.evaluationCount} compatible evaluations`,
        PAGE.margin + 12,
        y + 24,
        { width: 330 }
      );
    doc
      .fillColor(COLORS.muted)
      .fontSize(7)
      .text(
        "Weight    Score",
        PAGE.margin + 401,
        y + 17,
        { width: 88, align: "right" }
      );
    doc.y = y + 56;

    group.kpis.forEach((kpi) => {
      const nameHeight = doc
        .font("Helvetica")
        .fontSize(8)
        .heightOfString(kpi.name, {
          width: 157,
          lineGap: 1,
        });
      const rowHeight = Math.max(29, nameHeight + 6);
      ensureSpace(doc, model, rowHeight + 5);
      const rowY = doc.y;
      const barY = rowY + (rowHeight - 9) / 2;
      const valueY = rowY + (rowHeight - 8) / 2;
      doc
        .fillColor(COLORS.text)
        .font("Helvetica")
        .fontSize(8)
        .text(kpi.name, PAGE.margin, rowY, {
          width: 157,
          lineGap: 1,
        });
      doc
        .roundedRect(
          PAGE.margin + 166,
          barY,
          240,
          9,
          4.5
        )
        .fill(COLORS.blueLight);
      doc
        .roundedRect(
          PAGE.margin + 166,
          barY,
          Math.max(
            6,
            (Math.min(kpi.averageScore, 5) / 5) *
              240
          ),
          9,
          4.5
        )
        .fill(COLORS.blue);
      doc
        .fillColor(COLORS.muted)
        .font("Helvetica")
        .fontSize(8)
        .text(
          `${kpi.weight.toFixed(0)}%`,
          PAGE.margin + 416,
          valueY,
          { width: 38, align: "right" }
        )
        .fillColor(COLORS.navy)
        .font("Helvetica-Bold")
        .text(
          `${kpi.averageScore.toFixed(2)} / 5`,
          PAGE.margin + 458,
          valueY,
          { width: 53, align: "right" }
        );
      doc.y = rowY + rowHeight;
    });
    doc.y += 13;
  });
}

function badgeWidth(doc, label) {
  doc.font("Helvetica-Bold").fontSize(7.5);
  return Math.max(46, doc.widthOfString(label) + 18);
}

function drawBadge(doc, label, style, x, y) {
  const width = badgeWidth(doc, label);
  doc
    .roundedRect(x, y, width, 19, 9.5)
    .fillAndStroke(style.background, style.color);
  doc
    .fillColor(style.color)
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text(label, x, y + 6, {
      width,
      align: "center",
    });
  return width;
}

function drawMetadataGrid(doc, evaluation) {
  const y = doc.y;
  const columnWidth = PAGE.contentWidth / 3;
  const entries = [
    ["Supplier category", evaluation.supplierCategory],
    [
      "Reporting period",
      `Q${evaluation.quarter} ${evaluation.year}`,
    ],
    ["Evaluator", evaluation.evaluatorName],
    [
      "Submitted",
      formatDateTime(evaluation.submittedAt),
    ],
  ];

  entries.forEach((entry, index) => {
    const row = Math.floor(index / 3);
    const column = index % 3;
    const x = PAGE.margin + column * columnWidth;
    const entryY = y + row * 42;
    doc
      .fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(7)
      .text(entry[0], x, entryY, {
        width: columnWidth - 14,
      });
    doc
      .fillColor(COLORS.text)
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .text(entry[1], x, entryY + 13, {
        width: columnWidth - 14,
        lineGap: 1,
      });
  });
  doc.y = y + 80;
}

function drawKpiDetailRow(doc, model, kpi) {
  const nameHeight = doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .heightOfString(kpi.name, {
      width: 250,
    });
  const commentHeight = kpi.comment
    ? doc
        .font("Helvetica")
        .fontSize(7.5)
        .heightOfString(kpi.comment, {
          width: PAGE.contentWidth - 24,
          lineGap: 2,
        }) + 17
    : 0;
  const height = Math.max(48, nameHeight + 30) +
    commentHeight;

  ensureSpace(doc, model, height + 10);
  const y = doc.y;
  doc
    .roundedRect(
      PAGE.margin,
      y,
      PAGE.contentWidth,
      height,
      6
    )
    .fillAndStroke(COLORS.surface, COLORS.border);
  doc
    .fillColor(COLORS.navy)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(kpi.name, PAGE.margin + 12, y + 11, {
      width: 250,
    });
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(7.5)
    .text(
      `Weight: ${kpi.weight.toFixed(0)}%`,
      PAGE.margin + 12,
      y + 30,
      { width: 100 }
    );
  doc
    .roundedRect(
      PAGE.margin + 275,
      y + 15,
      166,
      10,
      5
    )
    .fill(COLORS.blueLight);
  doc
    .roundedRect(
      PAGE.margin + 275,
      y + 15,
      Math.max(7, (Math.min(kpi.score, 5) / 5) * 166),
      10,
      5
    )
    .fill(COLORS.blue);
  doc
    .fillColor(COLORS.navy)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(
      `${kpi.score.toFixed(0)} / 5`,
      PAGE.margin + 452,
      y + 15,
      { width: 45, align: "right" }
    );

  if (kpi.comment) {
    const commentY = y + Math.max(48, nameHeight + 30);
    doc
      .moveTo(PAGE.margin + 12, commentY - 6)
      .lineTo(
        PAGE.width - PAGE.margin - 12,
        commentY - 6
      )
      .strokeColor(COLORS.border)
      .lineWidth(0.6)
      .stroke();
    doc
      .fillColor(COLORS.muted)
      .font("Helvetica-Bold")
      .fontSize(7)
      .text("KPI comment", PAGE.margin + 12, commentY);
    doc
      .fillColor(COLORS.text)
      .font("Helvetica")
      .fontSize(7.5)
      .text(
        kpi.comment,
        PAGE.margin + 12,
        commentY + 12,
        {
          width: PAGE.contentWidth - 24,
          lineGap: 2,
        }
      );
  }
  doc.y = y + height + 9;
}

function drawEvaluationDetail(doc, model, evaluation) {
  doc.addPage();
  const titleY = doc.y;
  doc
    .fillColor(COLORS.muted)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("DETAILED RESULT", PAGE.margin, titleY);
  doc
    .fillColor(COLORS.navy)
    .font("Helvetica-Bold")
    .fontSize(19)
    .text(
      evaluation.supplierName,
      PAGE.margin,
      titleY + 17,
      {
      width: 330,
      lineGap: 2,
      }
    );

  const supplierTitleBottom = doc.y;
  doc
    .fillColor(COLORS.blueDark)
    .font("Helvetica-Bold")
    .fontSize(25)
    .text(
      evaluation.overallScore.toFixed(2),
      405,
      titleY + 14,
      { width: 70, align: "right" }
    )
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(8)
    .text("Overall score / 5", 390, titleY + 43, {
      width: 85,
      align: "right",
    });
  doc.y = Math.max(
    supplierTitleBottom,
    titleY + 59
  ) + 14;

  const ratingStyle =
    RATING_STYLE[evaluation.performanceRating] ?? {
      label: evaluation.performanceRating,
      color: COLORS.muted,
      background: COLORS.page,
    };
  const riskStyle =
    RISK_STYLE[evaluation.riskLevel] ?? {
      label: evaluation.riskLevel,
      color: COLORS.muted,
      background: COLORS.page,
    };
  const badgesY = doc.y;
  const ratingWidth = drawBadge(
    doc,
    ratingStyle.label,
    ratingStyle,
    PAGE.margin,
    badgesY
  );
  drawBadge(
    doc,
    `${riskStyle.label} risk`,
    riskStyle,
    PAGE.margin + ratingWidth + 8,
    badgesY
  );
  doc.y = badgesY + 40;
  drawMetadataGrid(doc, evaluation);

  sectionHeading(
    doc,
    "KPI Breakdown",
    "Saved KPI names and weights from this submitted evaluation."
  );
  evaluation.scores.forEach((kpi) =>
    drawKpiDetailRow(doc, model, kpi)
  );

  if (evaluation.overallComments) {
    const commentHeight = doc
      .font("Helvetica")
      .fontSize(8)
      .heightOfString(evaluation.overallComments, {
        width: PAGE.contentWidth - 24,
        lineGap: 2,
      });
    ensureSpace(
      doc,
      model,
      commentHeight + 56
    );
    const y = doc.y;
    doc
      .roundedRect(
        PAGE.margin,
        y,
        PAGE.contentWidth,
        commentHeight + 39,
        6
      )
      .fill(COLORS.blueLight);
    doc
      .fillColor(COLORS.navy)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text(
        "Overall evaluation comments",
        PAGE.margin + 12,
        y + 10
      );
    doc
      .fillColor(COLORS.text)
      .font("Helvetica")
      .fontSize(8)
      .text(
        evaluation.overallComments,
        PAGE.margin + 12,
        y + 25,
        {
          width: PAGE.contentWidth - 24,
          lineGap: 2,
        }
      );
    doc.y = y + commentHeight + 51;
  }
}

function drawFooters(doc, model) {
  const range = doc.bufferedPageRange();
  const totalPages = range.count;

  for (
    let pageIndex = range.start;
    pageIndex < range.start + range.count;
    pageIndex += 1
  ) {
    doc.switchToPage(pageIndex);
    const originalBottomMargin =
      doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .moveTo(PAGE.margin, PAGE.height - 38)
      .lineTo(
        PAGE.width - PAGE.margin,
        PAGE.height - 38
      )
      .strokeColor(COLORS.border)
      .lineWidth(0.6)
      .stroke();
    doc
      .fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(7)
      .text(
        "Generated by VendorPulse",
        PAGE.margin,
        PAGE.height - 29,
        { width: 170, lineBreak: false }
      )
      .text(
        model.scope.period,
        205,
        PAGE.height - 29,
        {
          width: 185,
          align: "center",
          lineBreak: false,
        }
      )
      .text(
        `Page ${pageIndex + 1} of ${totalPages}`,
        430,
        PAGE.height - 29,
        {
          width: 123,
          align: "right",
          lineBreak: false,
        }
      );
    doc.page.margins.bottom = originalBottomMargin;
  }
}

export function createEvaluationPdfFilename(scope = {}) {
  const parts = [
    "VendorPulse",
    "Supplier",
    "Performance",
  ];

  if (scope.supplierName) {
    const supplier = String(scope.supplierName)
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40);
    if (supplier) parts.push(supplier);
  }

  if (scope.quarter) parts.push(`Q${scope.quarter}`);
  if (scope.year) parts.push(String(scope.year));
  if (!scope.quarter && !scope.year) {
    parts.push("All_Periods");
  }

  return `${parts.join("_")}.pdf`;
}

export function createEvaluationPdfReport(
  reportData,
  { generatedAt = new Date() } = {}
) {
  const model = buildEvaluationPdfReportModel(
    reportData,
    { generatedAt }
  );

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: PAGE.top,
        right: 0,
        bottom: PAGE.bottom,
        left: 0,
      },
      bufferPages: true,
      compress: true,
      info: {
        Title: model.title,
        Author: "VendorPulse",
        Subject: `${model.scope.period} / ${model.scope.supplier}`,
        Creator: "VendorPulse",
      },
    });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () =>
      resolve(Buffer.concat(chunks))
    );
    doc.on("pageAdded", () =>
      drawRunningHeader(doc, model)
    );

    if (!model.evaluations.length) {
      drawEmptyReport(doc, model);
    } else {
      drawFirstPageHeader(doc, model);
      sectionHeading(
        doc,
        "Performance Overview",
        "Summary of the evaluations included by the active report filters."
      );
      drawSummaryCards(doc, model);
      drawDistributionSection(doc, model);

      if (model.evaluations.length === 1) {
        sectionHeading(
          doc,
          "Evaluation Summary",
          "This report contains one submitted supplier evaluation."
        );
        const evaluation = model.evaluations[0];
        const rating =
          RATING_STYLE[evaluation.performanceRating]
            ?.label ?? evaluation.performanceRating;
        const risk =
          RISK_STYLE[evaluation.riskLevel]?.label ??
          evaluation.riskLevel;
        const summaryY = doc.y;
        const summaryNameHeight = doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .heightOfString(evaluation.supplierName, {
            width: 240,
            lineGap: 1,
          });
        const summaryHeight = Math.max(
          57,
          summaryNameHeight + 39
        );
        doc
          .roundedRect(
            PAGE.margin,
            summaryY,
            PAGE.contentWidth,
            summaryHeight,
            7
          )
          .fillAndStroke(COLORS.surface, COLORS.border);
        doc
          .fillColor(COLORS.navy)
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(
            evaluation.supplierName,
            PAGE.margin + 12,
            summaryY + 12,
            { width: 240, lineGap: 1 }
          )
          .fillColor(COLORS.muted)
          .font("Helvetica")
          .fontSize(8)
          .text(
            `${rating} / ${risk} risk`,
            PAGE.margin + 12,
            summaryY + 18 + summaryNameHeight,
            { width: 240 }
          )
          .fillColor(COLORS.blueDark)
          .font("Helvetica-Bold")
          .fontSize(19)
          .text(
            `${evaluation.overallScore.toFixed(2)} / 5`,
            PAGE.margin + 330,
            summaryY + 18,
            { width: 155, align: "right" }
          );
        doc.y = summaryY + summaryHeight;
      } else {
        drawSupplierPerformance(doc, model);
      }

      drawKpiAnalysis(doc, model);
      model.evaluations.forEach((evaluation) =>
        drawEvaluationDetail(doc, model, evaluation)
      );
    }

    drawFooters(doc, model);
    doc.end();
  });
}
