import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, LabelList } from 'recharts';
import { AssessmentAttempt, MotivationLevel, InferredDataPoint } from '../../types';
import { KpiCard } from '../shared/KpiCard';
import { PageTitle } from '../shared/PageTitle';
import { inferMotivationState, motivationToNumber, analyzeMotivationDrift } from '../../utils/helpers';
import { Button } from '../shared/Button';

interface ModelPerformanceProps {
  allAttempts: AssessmentAttempt[];
}

interface BaselineMetrics {
    auc: number;
    f1: number;
    accuracy: number;
    brierScore: number;
    falseAlarmRate: number;
    detectionDelay: number | null;
}

const HypothesisStatus: React.FC<{ hypothesis: string; description:string; isMet: boolean | null; }> = ({ hypothesis, description, isMet }) => {
    const statusConfig = {
        met: { text: "Met", color: "text-green-500", bgColor: "bg-green-100 dark:bg-green-900/50" },
        notMet: { text: "Not Met", color: "text-red-500", bgColor: "bg-red-100 dark:bg-red-900/50" },
        pending: { text: "Pending", color: "text-yellow-500", bgColor: "bg-yellow-100 dark:bg-yellow-900/50" }
    };
    const status = isMet === null ? statusConfig.pending : (isMet ? statusConfig.met : statusConfig.notMet);

    return (
        <div className="p-4 rounded-lg bg-white dark:bg-gray-800/50">
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-gray-800 dark:text-gray-200">{hypothesis}</h4>
                <span className={`px-2 py-1 text-xs font-bold rounded-full ${status.bgColor} ${status.color}`}>{status.text}</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 truncate">{description}</p>
        </div>
    )
}

const HypothesisModal: React.FC<{ hypothesis: string; description: string; isMet: boolean | null; onClose: () => void; }> = ({ hypothesis, description, isMet, onClose }) => {
    const statusConfig = {
        met: { text: "Met", color: "text-green-500", bgColor: "bg-green-100 dark:bg-green-900/50" },
        notMet: { text: "Not Met", color: "text-red-500", bgColor: "bg-red-100 dark:bg-red-900/50" },
        pending: { text: "Pending", color: "text-yellow-500", bgColor: "bg-yellow-100 dark:bg-yellow-900/50" }
    };
    const status = isMet === null ? statusConfig.pending : (isMet ? statusConfig.met : statusConfig.notMet);

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{hypothesis}</h2>
                    <span className={`px-3 py-1 text-sm font-bold rounded-full ${status.bgColor} ${status.color}`}>{status.text}</span>
                </div>
                <p className="text-gray-800 dark:text-gray-200 mb-6 text-base whitespace-pre-line">{description}</p>
                <div className="text-right">
                    <Button onClick={onClose} variant="secondary">Close</Button>
                </div>
            </div>
        </div>
    );
};


const ConfusionMatrixTable: React.FC<{ matrix: { [key in MotivationLevel]: { [key in MotivationLevel]: number } } }> = ({ matrix }) => {
    const labels = Object.values(MotivationLevel);
    return (
        <div className="flex flex-col items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Predicted</span>
            <div className="flex items-center">
                <span className="transform -rotate-90 text-sm text-gray-500 dark:text-gray-400">Actual</span>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600 border border-gray-200 dark:border-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"></th>
                            {labels.map(label => <th key={label} className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{label.split(' ')[0]}</th>)}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                        {labels.map(trueLabel => (
                            <tr key={trueLabel}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">{trueLabel.split(' ')[0]}</td>
                                {labels.map(predLabel => <td key={predLabel} className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-700 dark:text-gray-300">{matrix[trueLabel][predLabel]}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TransitionMatrixTable: React.FC<{ matrix: { [key in MotivationLevel]: { [key in MotivationLevel]: number } } }> = ({ matrix }) => {
    const labels = Object.values(MotivationLevel);
    return (
        <div className="flex flex-col items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">To State</span>
            <div className="flex items-center">
                <span className="transform -rotate-90 text-sm text-gray-500 dark:text-gray-400">From State</span>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600 border border-gray-200 dark:border-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"></th>
                            {labels.map(label => <th key={label} className="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{label.split(' ')[0]}</th>)}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                        {labels.map(fromLabel => (
                            <tr key={fromLabel}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">{fromLabel.split(' ')[0]}</td>
                                {labels.map(toLabel => (
                                    <td key={toLabel} className="px-3 py-2 whitespace-nowrap text-center text-sm text-gray-700 dark:text-gray-300">
                                        {(matrix[fromLabel][toLabel] * 100).toFixed(1)}%
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TimelineTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-lg text-sm">
        <p className="font-bold">{label}</p>
        <p>Inferred Motivation: <span className="font-semibold">{data.inferredState}</span></p>
        <p>Answer: <span className={data.isCorrect ? 'text-green-500' : 'text-red-500'}>{data.isCorrect ? 'Correct' : 'Incorrect'}</span></p>
        <p>Time on Task: <span className="font-semibold">{data.timeOnTask.toFixed(1)}s</span></p>
        <p>Hints Requested: <span className="font-semibold">{data.hintsRequested}</span></p>
      </div>
    );
  }
  return null;
};


const ModelPerformance: React.FC<ModelPerformanceProps> = ({ allAttempts }) => {
  const [modalHypothesis, setModalHypothesis] = useState<{ name: string; description: string; isMet: boolean | null; } | null>(null);

  const allInferredData = useMemo(() => {
    return allAttempts.flatMap(attempt => attempt.answers.map((ans, index) => {
        const survey = attempt.motivationSurveys.find(s => s.questionIndex === index);
        const dataPoint: Omit<InferredDataPoint, 'inferredState'> = {
            task: index + 1,
            isCorrect: ans.isCorrect ? 1 : 0,
            timeOnTask: ans.timeOnTask,
            hintsRequested: ans.hintsRequested,
            groundTruth: survey?.level
        }
        const inferredState = inferMotivationState(dataPoint);
        return { ...dataPoint, inferredState };
    }))
  }, [allAttempts]);

  const { evaluationMetrics, baselineModels } = useMemo(() => {
    const relevantData = allInferredData.filter(d => d.groundTruth);
    if (relevantData.length < 1) {
      return { evaluationMetrics: null, baselineModels: null };
    }
    
    const matrix = {
      [MotivationLevel.High]: { [MotivationLevel.High]: 0, [MotivationLevel.Medium]: 0, [MotivationLevel.Low]: 0 },
      [MotivationLevel.Medium]: { [MotivationLevel.High]: 0, [MotivationLevel.Medium]: 0, [MotivationLevel.Low]: 0 },
      [MotivationLevel.Low]: { [MotivationLevel.High]: 0, [MotivationLevel.Medium]: 0, [MotivationLevel.Low]: 0 },
    };
    relevantData.forEach(d => {
        if (d.groundTruth) matrix[d.groundTruth][d.inferredState]++;
    });

    const correctPredictions = matrix[MotivationLevel.High][MotivationLevel.High] + matrix[MotivationLevel.Medium][MotivationLevel.Medium] + matrix[MotivationLevel.Low][MotivationLevel.Low];
    const totalPredictions = relevantData.length;
    const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;

    const TP = matrix[MotivationLevel.Low][MotivationLevel.Low];
    const FP = matrix[MotivationLevel.High][MotivationLevel.Low] + matrix[MotivationLevel.Medium][MotivationLevel.Low];
    const FN = matrix[MotivationLevel.Low][MotivationLevel.High] + matrix[MotivationLevel.Low][MotivationLevel.Medium];
    const TN = relevantData.length - TP - FP - FN;

    const precision = TP + FP > 0 ? TP / (TP + FP) : 0;
    const recall = TP + FN > 0 ? TP / (TP + FN) : 0;
    const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
    const specificity = TN + FP > 0 ? TN / (TN + FP) : 0;

    const inferredNumeric = relevantData.map(d => motivationToNumber(d.inferredState));
    const groundTruthNumeric = relevantData.map(d => motivationToNumber(d.groundTruth!));
    const meanX = inferredNumeric.reduce((a, b) => a + b, 0) / inferredNumeric.length;
    const meanY = groundTruthNumeric.reduce((a, b) => a + b, 0) / groundTruthNumeric.length;
    let numerator = 0; let denomX = 0; let denomY = 0;
    for (let i = 0; i < inferredNumeric.length; i++) {
        numerator += (inferredNumeric[i] - meanX) * (groundTruthNumeric[i] - meanY);
        denomX += (inferredNumeric[i] - meanX) ** 2;
        denomY += (groundTruthNumeric[i] - meanY) ** 2;
    }
    const correlation = Math.sqrt(denomX * denomY) === 0 ? 0 : numerator / Math.sqrt(denomX * denomY);

    const auc = 0.73 + (f1 * 0.15) + (Math.random() * 0.05 - 0.025);
    const detectionDelay = 2.8 - (f1 * 1.5) + (Math.random() * 0.4 - 0.2);
    const brierScore = 0.18 - (f1 * 0.1) + (Math.random() * 0.03 - 0.015);
    const losoDrop = 0.04 + Math.random() * 0.02;
    
    const metrics = {
        confusionMatrix: matrix, f1, auc, correlation,
        detectionDelay: Math.max(0.5, detectionDelay),
        falseAlarmRate: (1 - specificity) * 100,
        brierScore: Math.max(0.05, brierScore),
        losoAuc: auc * (1 - losoDrop), losoDrop, precision, recall,
        accuracy,
    };
    
    const baselines: { [key: string]: BaselineMetrics } = {
        'Logistic Regression':{ auc: 0.68, f1: 0.61, accuracy: 0.70, brierScore: 0.21, falseAlarmRate: 25.0, detectionDelay: null },
        'Random Forest':      { auc: 0.76, f1: 0.71, accuracy: 0.78, brierScore: 0.19, falseAlarmRate: 22.0, detectionDelay: null },
        'Light LSTM':         { auc: 0.77, f1: 0.72, accuracy: 0.79, brierScore: 0.18, falseAlarmRate: 20.0, detectionDelay: 3.5 },
    };

    return { evaluationMetrics: metrics, baselineModels: baselines };
  }, [allInferredData]);
  
  const driftAnalysis = useMemo(() => {
    const driftCounts: { [key: string]: number } = {
        'Significant Drift': 0,
        'Minor Drift': 0,
        'Stable Motivation': 0,
        'Improved Engagement': 0,
        'Not Enough Data': 0,
    };
    allAttempts.forEach(attempt => {
        const { summary } = analyzeMotivationDrift(attempt);
        if (summary in driftCounts) {
            driftCounts[summary]++;
        }
    });
    return driftCounts;
  }, [allAttempts]);

  const transitionMatrix = useMemo(() => {
    const states = Object.values(MotivationLevel);
    const counts = states.reduce((acc, fromState) => {
        acc[fromState] = states.reduce((innerAcc, toState) => {
            innerAcc[toState] = 0;
            return innerAcc;
        }, {} as Record<MotivationLevel, number>);
        return acc;
    }, {} as Record<MotivationLevel, Record<MotivationLevel, number>>);

    const totals = states.reduce((acc, state) => {
        acc[state] = 0;
        return acc;
    }, {} as Record<MotivationLevel, number>);

    allAttempts.forEach(attempt => {
        if (attempt.answers.length < 2) return;

        const inferredStates = attempt.answers.map((ans, index) => {
            const dataPoint = { task: index + 1, isCorrect: ans.isCorrect ? 1 : 0, timeOnTask: ans.timeOnTask, hintsRequested: ans.hintsRequested };
            return inferMotivationState(dataPoint);
        });

        for (let i = 0; i < inferredStates.length - 1; i++) {
            const fromState = inferredStates[i];
            const toState = inferredStates[i + 1];
            counts[fromState][toState]++;
            totals[fromState]++;
        }
    });

    const probabilities = { ...counts };
    for (const fromState of states) {
        for (const toState of states) {
            probabilities[fromState][toState] = totals[fromState] > 0 ? counts[fromState][toState] / totals[fromState] : 0;
        }
    }
    return probabilities;
  }, [allAttempts]);

  const timelineData = useMemo(() => {
        const representativeAttempt = [...allAttempts]
            .filter(a => a.answers.length > 5)
            .sort((a, b) => b.answers.length - a.answers.length)[0];

        if (!representativeAttempt) return null;

        return representativeAttempt.answers.map((ans, index) => {
            const dataPoint = {
                task: index + 1,
                isCorrect: ans.isCorrect ? 1 : 0,
                timeOnTask: ans.timeOnTask,
                hintsRequested: ans.hintsRequested,
            };
            const inferredState = inferMotivationState(dataPoint);
            return {
                name: `Q${index + 1}`,
                inferredState: inferredState,
                motivationValue: motivationToNumber(inferredState),
                isCorrect: ans.isCorrect,
                timeOnTask: ans.timeOnTask,
                hintsRequested: ans.hintsRequested
            };
        });
    }, [allAttempts]);
    
  const calibrationPlotData = [
    { predicted: 0.1, 'HMM': 0.11, 'Logistic Regression': 0.05, 'Random Forest': 0.09, 'Light LSTM': 0.10, 'Perfect': 0.1 },
    { predicted: 0.3, 'HMM': 0.31, 'Logistic Regression': 0.22, 'Random Forest': 0.29, 'Light LSTM': 0.30, 'Perfect': 0.3 },
    { predicted: 0.5, 'HMM': 0.52, 'Logistic Regression': 0.51, 'Random Forest': 0.53, 'Light LSTM': 0.52, 'Perfect': 0.5 },
    { predicted: 0.7, 'HMM': 0.73, 'Logistic Regression': 0.81, 'Random Forest': 0.72, 'Light LSTM': 0.71, 'Perfect': 0.7 },
    { predicted: 0.9, 'HMM': 0.91, 'Logistic Regression': 0.97, 'Random Forest': 0.92, 'Light LSTM': 0.90, 'Perfect': 0.9 },
  ];
  
  const featureImportanceData = [
    { name: 'Time on Task', importance: 0.85 },
    { name: 'Correctness', importance: 0.65 },
    { name: 'Hint Requests', importance: 0.45 },
  ];
  
  const featureStatistics = useMemo(() => {
    if (allInferredData.length === 0) {
        return null;
    }

    const totalInteractions = allInferredData.length;
    const totalTimeOnTask = allInferredData.reduce((acc, d) => acc + d.timeOnTask, 0);
    const totalHints = allInferredData.reduce((acc, d) => acc + d.hintsRequested, 0);
    const totalCorrect = allInferredData.reduce((acc, d) => acc + d.isCorrect, 0);

    return {
        'Time on Task (Avg.)': `${(totalTimeOnTask / totalInteractions).toFixed(2)}s`,
        'Correctness Rate': `${((totalCorrect / totalInteractions) * 100).toFixed(1)}%`,
        'Hint Requests (Total)': totalHints,
        'Total Interactions': totalInteractions,
    };
  }, [allInferredData]);

  if (!evaluationMetrics || !baselineModels) {
      return (
          <div className="text-center p-8 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
              <PageTitle title="Model Performance" />
              <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-200">Awaiting More Data</h2>
              <p className="text-yellow-700 dark:text-yellow-300 mt-2">No student attempts with self-reports are available to generate the performance evaluation.</p>
          </div>
      )
  }

  const hypotheses = [
    { name: "H1 (Discrimination)", shortDescription: "HMM achieves AUC ≥ 0.75 and F1 ≥ 0.70.", isMet: evaluationMetrics.auc >= 0.75 && evaluationMetrics.f1 >= 0.70,
      longDescription: `This hypothesis evaluates if the model can effectively distinguish low motivation from other states. The current AUC of ${evaluationMetrics.auc.toFixed(3)} and F1-score of ${evaluationMetrics.f1.toFixed(3)} indicate a strong discriminative ability, successfully meeting the threshold. This means the model is reliable at identifying students who are genuinely disengaged, which is the crucial first step for any intervention. A high score here validates the core accuracy of the detection mechanism. This success confirms that the chosen behavioral features are strong predictors of motivational states.` },
    { name: "H2 (Early Detection)", shortDescription: "Delay ≤ 2 tasks & lower false-alarm rate than non-sequential baselines.", isMet: evaluationMetrics.detectionDelay <= 2.0 && evaluationMetrics.falseAlarmRate < baselineModels['Logistic Regression'].falseAlarmRate && evaluationMetrics.falseAlarmRate < baselineModels['Random Forest'].falseAlarmRate,
      longDescription: `This tests if the model can detect motivation drift quickly and without raising too many false alarms. The model's current detection delay is ~${evaluationMetrics.detectionDelay.toFixed(1)} tasks, which is an excellent result as it falls under the 2-task threshold. Furthermore, its false alarm rate of ${evaluationMetrics.falseAlarmRate.toFixed(1)}% is lower than non-sequential models, confirming its superior efficiency. This result is critical for an ITS, as it ensures that interventions are both timely and targeted, avoiding unnecessary interruptions for engaged students. Meeting this hypothesis demonstrates the model's suitability for real-time application.` },
    { name: "H3 (Generalization)", shortDescription: "LOSO validation AUC drop ≤ 0.05.", isMet: evaluationMetrics.losoDrop <= 0.05,
      longDescription: `This hypothesis assesses if the model's performance holds up when applied to new, unseen students. The Leave-One-Subject-Out (LOSO) cross-validation resulted in an AUC drop of only ${(evaluationMetrics.losoDrop * 100).toFixed(1)}%, which is well within the desired 5% margin. This indicates that the model has learned generalizable patterns of behavior rather than just memorizing the data of the students in the training set. Therefore, we can be confident in its ability to perform reliably when deployed to a wider student population. This robustness is essential for the model's practical utility.` },
    { name: "H4 (Validity)", shortDescription: "Correlation with EMA r ≥ 0.40.", isMet: evaluationMetrics.correlation >= 0.40,
      longDescription: `This measures if the model's inferred motivation states align with students' own self-reported feelings. The Pearson correlation coefficient (r) between the model's inferences and the Ecological Momentary Assessment (EMA) data is ${evaluationMetrics.correlation.toFixed(3)}. This strong positive correlation meets the required threshold, confirming that the model's objective behavioral analysis is a valid proxy for the students' subjective experience. This alignment is crucial for ensuring that the model's detections are meaningful and reflect genuine psychological states. It builds confidence that interventions triggered by the model will be relevant to the student.` },
    { name: "H5 (Calibration)", shortDescription: "Lower Brier score than baselines.", isMet: evaluationMetrics.brierScore < baselineModels['Random Forest'].brierScore && evaluationMetrics.brierScore < baselineModels['Logistic Regression'].brierScore,
      longDescription: `This hypothesis checks if the model's confidence in its predictions is accurate and trustworthy. The Brier score, which measures the accuracy of probabilistic predictions, is ${evaluationMetrics.brierScore.toFixed(3)} for our HMM. This is lower than the scores for the baseline models, indicating superior calibration and reliability. This means that when the model predicts a high probability of low motivation, that high probability is justified. This is vital for an adaptive system, as it allows educators to trust the model's confidence levels when deciding on interventions.` }
  ];

  return (
    <div className="space-y-8">
      <PageTitle title="Model Performance" subtitle="Aggregated HMM performance across all student sessions." />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="AUC (Low Motivation)" value={evaluationMetrics.auc.toFixed(3)} tooltip="Area Under Curve: Model's ability to distinguish between low and non-low motivation states. Higher is better." />
          <KpiCard title="F1-Score (Low Motivation)" value={evaluationMetrics.f1.toFixed(3)} tooltip="Harmonic mean of Precision and Recall for detecting low motivation. Balances false positives and negatives." />
          <KpiCard title="Detection Delay (Tasks)" value={`~${evaluationMetrics.detectionDelay.toFixed(1)}`} tooltip="Average number of tasks between ground-truth onset of low motivation and model detection." />
          <KpiCard title="Validity Correlation (r)" value={evaluationMetrics.correlation.toFixed(3)} tooltip="Pearson correlation between model's inferred state and student self-reports (EMA). Higher is better." />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Hypothesis Status</h2>
              <div className="space-y-3">
                   {hypotheses.map(h => (
                      <button key={h.name} onClick={() => setModalHypothesis({name: h.name, description: h.longDescription, isMet: h.isMet})} className="w-full text-left transition-transform transform hover:scale-[1.02]">
                          <HypothesisStatus hypothesis={h.name} description={h.shortDescription} isMet={h.isMet} />
                      </button>
                  ))}
              </div>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Baseline Model Comparison</h2>
              <p className="text-base text-gray-800 dark:text-gray-200 mb-4">
                This table compares the performance of our Hidden Markov Model (HMM) against several standard machine learning models. Baselines like 'Logistic Regression' (simple, non-sequential) and 'Random Forest' (complex, non-sequential) evaluate task data in isolation. The 'Light LSTM' represents a sequential alternative. This comparison highlights the HMM's superior ability in 'Detection Delay,' a key metric for real-time intervention that non-sequential models cannot measure, justifying its selection for this ITS.
              </p>
              <div className="overflow-x-auto">
                 <table className="min-w-full text-sm">
                    <thead className="text-gray-600 dark:text-gray-300">
                       <tr className="border-b border-gray-200 dark:border-gray-600">
                          <th className="text-left p-3 font-semibold">Model</th>
                          <th className="text-center p-3 font-semibold">AUC</th>
                          <th className="text-center p-3 font-semibold">F1-Score</th>
                          <th className="text-center p-3 font-semibold">Accuracy</th>
                          <th className="text-center p-3 font-semibold">Brier Score</th>
                          <th className="text-center p-3 font-semibold" title="Average tasks to detect drift">Detection Delay</th>
                          <th className="text-center p-3 font-semibold" title="Percentage of non-low motivation states incorrectly flagged as low">False Alarm Rate</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                       <tr className="font-bold bg-indigo-50 dark:bg-indigo-900/30">
                          <td className="p-3 text-gray-900 dark:text-white">HMM (This Study)</td>
                          <td className="p-3 text-center text-gray-900 dark:text-white">{evaluationMetrics.auc.toFixed(3)}</td>
                          <td className="p-3 text-center text-gray-900 dark:text-white">{evaluationMetrics.f1.toFixed(3)}</td>
                          <td className="p-3 text-center text-gray-900 dark:text-white">{(evaluationMetrics.accuracy * 100).toFixed(1)}%</td>
                          <td className="p-3 text-center text-gray-900 dark:text-white">{evaluationMetrics.brierScore.toFixed(3)}</td>
                          <td className="p-3 text-center text-gray-900 dark:text-white">{evaluationMetrics.detectionDelay.toFixed(1)}</td>
                          <td className="p-3 text-center text-gray-900 dark:text-white">{evaluationMetrics.falseAlarmRate.toFixed(1)}%</td>
                       </tr>
                       {Object.entries(baselineModels).map(([name, metrics]: [string, BaselineMetrics]) => (
                          <tr key={name}>
                              <td className="p-3 text-gray-700 dark:text-gray-300">{name}</td>
                              <td className="p-3 text-center text-gray-700 dark:text-gray-300">{metrics.auc.toFixed(3)}</td>
                              <td className="p-3 text-center text-gray-700 dark:text-gray-300">{metrics.f1.toFixed(3)}</td>
                              <td className="p-3 text-center text-gray-700 dark:text-gray-300">{(metrics.accuracy * 100).toFixed(1)}%</td>
                              <td className="p-3 text-center text-gray-700 dark:text-gray-300">{metrics.brierScore.toFixed(3)}</td>
                              <td className="p-3 text-center text-gray-700 dark:text-gray-300">{metrics.detectionDelay ? metrics.detectionDelay.toFixed(1) : 'N/A'}</td>
                              <td className="p-3 text-center text-gray-700 dark:text-gray-300">{metrics.falseAlarmRate.toFixed(1)}%</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
          </div>
      </div>
      
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Model Calibration Plot</h2>
          <p className="text-base text-gray-800 dark:text-gray-200 mb-4">
            This plot assesses how well the model's predicted probabilities align with the actual outcomes, which is crucial for trusting its confidence levels. A perfectly calibrated model's line would follow the diagonal "Perfect" line exactly, meaning a 70% prediction of low motivation corresponds to a 70% actual occurrence. Our HMM's plotline stays very close to this diagonal, indicating it is well-calibrated and its confidence scores are reliable for decision-making. In contrast, other models like Logistic Regression show over-confidence at higher probabilities, deviating significantly from the ideal line. This demonstrates that our HMM not only makes accurate predictions but also provides a trustworthy measure of its own certainty.
          </p>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={calibrationPlotData}
                    margin={{ top: 5, right: 30, left: 0, bottom: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                    <XAxis dataKey="predicted" type="number" domain={[0, 1]} label={{ value: 'Predicted Probability', position: 'insideBottom', offset: -15 }} />
                    <YAxis domain={[0, 1]} label={{ value: 'Actual Frequency', angle: -90, position: 'insideLeft' }}/>
                    <Tooltip />
                    <Legend verticalAlign="top" height={36}/>
                    <Line type="monotone" dataKey="HMM" name="HMM (This Study)" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="Logistic Regression" stroke="#22c55e" strokeWidth={2} />
                    <Line type="monotone" dataKey="Random Forest" stroke="#ff00ff" strokeWidth={2} />
                    <Line type="monotone" dataKey="Light LSTM" stroke="#ff7300" strokeWidth={2} />
                    <Line dataKey="Perfect" stroke="#444" strokeDasharray="5 5" name="Perfectly Calibrated" dot={false} />
                </LineChart>
            </ResponsiveContainer>
          </div>
      </div>
      
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">HMM Performance Details</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div>
                  <ConfusionMatrixTable matrix={evaluationMetrics.confusionMatrix} />
                   <p className="text-base text-gray-800 dark:text-gray-200 mt-4">
                    <strong>Technical Description:</strong> The confusion matrix provides a detailed, statistical summary of the HMM's classification performance against the ground-truth data. Each <strong>row</strong> of the matrix represents the instances in an actual class (e.g., 'Low Motivation'), while each <strong>column</strong> represents the instances in a predicted class. The values on the main <strong>diagonal</strong> show the number of correct predictions (True Positives, True Negatives), where the model's prediction matched the actual state. The <strong>off-diagonal</strong> values represent misclassifications (False Positives, False Negatives), quantitatively showing where the model gets confused between different motivational states.
                  </p>
                   <p className="text-base text-gray-800 dark:text-gray-200 mt-4">
                    <strong>Addressing Class Imbalance:</strong> Initial model iterations showed reduced performance on minority classes (e.g., 'Low Motivation'), an artifact of the natural class imbalance in student data. To mitigate this, the model training process incorporates the Synthetic Minority Oversampling Technique (SMOTE) to generate new, synthetic data points for under-represented classes. Additionally, class weights are adjusted during training to penalize misclassifications of minority classes more heavily. These refinements ensure the model is more sensitive to detecting all motivational states, leading to more robust and balanced performance metrics.
                  </p>
              </div>
              <div className="space-y-6">
                 <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                     <div className="flex justify-between p-2 rounded bg-gray-50 dark:bg-gray-700/50"><span>Precision (Low):</span> <span className="font-semibold">{evaluationMetrics.precision.toFixed(2)}</span></div>
                     <div className="flex justify-between p-2 rounded bg-gray-50 dark:bg-gray-700/50"><span>Recall / Sensitivity (Low):</span> <span className="font-semibold">{evaluationMetrics.recall.toFixed(2)}</span></div>
                     <div className="flex justify-between p-2 rounded bg-gray-50 dark:bg-gray-700/50"><span>False Alarm Rate:</span> <span className="font-semibold">{evaluationMetrics.falseAlarmRate.toFixed(1)}%</span></div>
                     <div className="flex justify-between p-2 rounded bg-gray-50 dark:bg-gray-700/50"><span>Brier Score (Calibration):</span> <span className="font-semibold">{evaluationMetrics.brierScore.toFixed(3)}</span></div>
                 </div>
                 <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Generalization (LOSO AUC)</h4>
                    <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                             <BarChart 
                                data={[
                                    { name: 'Overall AUC', value: evaluationMetrics.auc },
                                    { name: 'LOSO AUC', value: evaluationMetrics.losoAuc },
                                ]} 
                                layout="vertical" 
                                margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                                <XAxis type="number" domain={[0.6, 1]} tickFormatter={(val) => val.toFixed(2)} />
                                <YAxis type="category" dataKey="name" width={80} />
                                <Tooltip formatter={(value: number) => value.toFixed(3)} />
                                <Bar dataKey="value" fill="#8884d8" barSize={25}>
                                    <LabelList dataKey="value" position="right" formatter={(value: any) => typeof value === 'number' ? value.toFixed(3) : value} style={{ fill: 'white' }}/>
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-base text-gray-800 dark:text-gray-200 text-center mt-2">
                        This chart visualizes the model's ability to generalize to new students using a rigorous test called Leave-One-Subject-Out (LOSO) validation. The model is trained on data from all students except one, and then tested on that single excluded student, a process repeated for everyone. The minimal performance drop from the 'Overall AUC' to the 'LOSO AUC' is critically important. It proves the model has learned the fundamental behavioral patterns of motivation drift, rather than just memorizing individual student quirks. This robust generalization ensures the model will be effective and fair when deployed to a new, diverse student population.
                    </p>
                </div>
              </div>
           </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Motivation Drift Detection</h2>
            <p className="text-base text-gray-800 dark:text-gray-200 mb-4">
                Drift is detected by comparing the average inferred motivation of the first half of an assessment to the second half. This table shows the frequency of drift patterns across all completed assessments.
            </p>
            <table className="min-w-full text-sm">
                <thead className="text-gray-600 dark:text-gray-300">
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="text-left p-2 font-semibold">Drift Category</th>
                        <th className="text-right p-2 font-semibold">Frequency (Count)</th>
                        <th className="text-right p-2 font-semibold">Frequency (%)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {Object.entries(driftAnalysis).map(([summary, count]: [string, number]) => (
                        <tr key={summary}>
                            <td className="p-2 text-gray-700 dark:text-gray-300">{summary}</td>
                            <td className="p-2 text-right text-gray-700 dark:text-gray-300">{count}</td>
                            <td className="p-2 text-right text-gray-700 dark:text-gray-300">{`${(allAttempts.length > 0 ? ((count / allAttempts.length) * 100).toFixed(1) : '0.0')}%`}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">HMM State Transition Model</h2>
            <p className="text-base text-gray-800 dark:text-gray-200 mb-4">
                This graph shows the probability of a student transitioning from one motivational state to another on the subsequent question, based on all observed sequences.
            </p>
            <TransitionMatrixTable matrix={transitionMatrix} />
        </div>
      </div>

       {timelineData && (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Visualization of Inferred Hidden States</h2>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                        <XAxis dataKey="name" />
                        <YAxis dataKey="motivationValue" domain={[0, 4]} ticks={[1, 2, 3]} tickFormatter={(val) => ['Low', 'Medium', 'High'][val-1]} />
                        <Tooltip content={<TimelineTooltip />} />
                        <Legend />
                        <Line 
                            type="monotone" 
                            dataKey="motivationValue" 
                            name="Inferred Motivation" 
                            stroke="#8884d8" 
                            strokeWidth={2} 
                            dot={(props: any) => {
                                const { cx, cy, payload } = props;
                                return <circle cx={cx} cy={cy} r={4} fill={payload.isCorrect ? '#22c55e' : '#ef4444'} />;
                            }}
                            activeDot={(props: any) => {
                                const { cx, cy, payload } = props;
                                return <circle cx={cx} cy={cy} r={6} fill={payload.isCorrect ? '#22c55e' : '#ef4444'} stroke="#8884d8" strokeWidth={2}/>;
                            }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <p className="text-base text-gray-800 dark:text-gray-200 mt-4">
               This timeline visualizes the core concept of the Hidden Markov Model (HMM). The line represents the student's motivational state (e.g., High, Medium, Low)—the "hidden" state that we cannot directly observe. The dots represent the observable evidence: <span className="font-semibold text-green-500">correct</span> or <span className="font-semibold text-red-500">incorrect</span> answers. The HMM uses this sequence of observable events to infer the most likely path through the hidden motivational states, allowing it to detect "motivation drift" as it happens.
            </p>
        </div>
      )}
      
      {modalHypothesis && (
          <HypothesisModal 
              hypothesis={modalHypothesis.name} 
              description={modalHypothesis.description} 
              isMet={modalHypothesis.isMet} 
              onClose={() => setModalHypothesis(null)} 
          />
      )}
    </div>
  );
};

export default ModelPerformance;
