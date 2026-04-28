#![allow(clippy::upper_case_acronyms)]
use dist::Dist;
use dist::NoncentralChisq;
use dist::NoncentralF;
use dist::NoncentralT;
use dist::NormalDist;
use rand::Rng;
use rand::SeedableRng;
use rand_chacha::ChaCha8Rng;
use roots::find_root_regula_falsi;
use roots::SimpleConvergency;
use serde_json::Value;

/// Supertype for all test types.
///
/// See the G*Power 3 paper for the equations for the distribution parameters
/// (https://doi.org/10.3758/BF03193146).
pub enum TestKind {
    /// Means: Difference from constant (one sample case).
    OneSampleTTest,
    /// Means: Difference between two independent means (two groups).
    IndependentSamplesTTest,
    /// Means: Difference between two dependent means (matched pairs).
    DependentSamplesTTest,
    /// Goodness-of-fit tests: Contingency tables.
    GoodnessOfFitChisqTest {
        /// Degrees of freedom.
        df: i64,
    },
    /// Linear multiple regression: Fixed model, R^2 deviation from zero.
    DeviationFromZeroMultipleRegression {
        /// Number of predictors (#A).
        n_predictors: i64,
    },
    /// Multiple regression: increase of R^2.
    IncreaseMultipleRegression {
        /// Total number of predictors (#A + #B).
        rho: i64,
        /// Number of tested predictors (#B).
        q: i64,
    },
    /// ANCOVA: Fixed effects, main effects and interactions.
    ANCOVA {
        /// Number of groups.
        /// In factorial ANCOVA is A*B*C.
        k: i64,
        /// Degrees of freedom of the tested effect.
        /// (number of factor levels - 1).
        /// In ANCOVA it depends on what factor you are interested,
        /// e.g. A, B, or C.
        q: i64,
        /// Number of covariates.
        p: i64,
    },
    /// ANOVA: Fixed effects, omnibus, one-way.
    OneWayANOVA {
        /// Number of groups.
        k: i64,
    },
    /// ANOVA: Fixed effects, special, main effects and interactions.
    TwoWayANOVA {
        /// Total number of cells in the design.
        k: i64,
        /// Degrees of freedom of the tested effect.
        /// (number of factor levels - 1).
        q: i64,
    },
    /// ANOVA: Repeated measures, between factors.
    BetweenRepeatedANOVA {
        /// Levels of between factor.
        k: i64,
        /// Levels of repeated measures.
        m: i64,
        /// Correlation among repeated measures.
        rho: f64,
    },
    /// ANOVA: Repeated measures, within factors.
    WithinRepeatedANOVA {
        /// Levels of between factor.
        k: i64,
        /// Levels of repeated measures.
        m: i64,
        /// Correlation among repeated measures.
        rho: f64,
        /// Nonsphericity correction.
        epsilon: f64,
    },
    /// ANOVA: Repeated measures, within-between interactions.
    WithinBetweenRepeatedANOVA {
        /// Levels of between factor.
        k: i64,
        /// Levels of repeated measures.
        m: i64,
        /// Correlation among repeated measures.
        rho: f64,
        /// Nonsphericity correction.
        epsilon: f64,
    },
    /// Hotelling's T²: One group mean vector.
    HotellingsOneGroup {
        /// Number of dependent variables.
        p: i64,
    },
    /// Hotelling's T²: Two group mean vectors.
    HotellingsTwoGroups {
        /// Number of dependent variables.
        p: i64,
    },
    /// MANOVA: Global effects (Pillai's trace F-approximation).
    MANOVAGlobalEffects {
        /// Number of dependent variables (response variables).
        p: i64,
        /// Number of groups.
        k: i64,
    },
    /// z-test: Two independent Pearson correlations.
    TwoIndependentCorrelations,
    /// z-test: Two dependent Pearson correlations (common index).
    TwoDependentCorrelationsCommon {
        /// Common sample size for both correlations.
        n_common: i64,
    },
    /// z-test: Two dependent Pearson correlations (no common index).
    TwoDependentCorrelationsNoCommon,
    /// z-test: Logistic regression.
    LogisticRegression {
        /// Probability of event under H0.
        p0: f64,
        /// R² of other covariates.
        r2: f64,
    },
}

#[derive(Clone, Debug)]
pub enum Tail {
    OneSided,
    TwoSided,
}

fn parse_i64(data: &Value, field: &str) -> Result<i64, String> {
    let value = match data.get(field) {
        Some(value) => value,
        None => return Err(format!("Missing field: {}", field)),
    };
    let value: &str = value
        .as_str()
        .expect("{field} could not be converted to a str");
    let value: i64 = value
        .parse()
        .expect("{field} could not be converted to an integer");
    Ok(value)
}

fn parse_f64(data: &Value, field: &str) -> Result<f64, String> {
    let value = match data.get(field) {
        Some(value) => value,
        None => return Err(format!("Missing field: {}", field)),
    };
    let value: &str = value
        .as_str()
        .expect("{field} could not be converted to a str");
    let value: f64 = value
        .parse()
        .expect("{field} could not be converted to a floating number");
    Ok(value)
}

impl Tail {
    pub fn from_json(data: &Value) -> Option<Tail> {
        let tail: i64 = parse_i64(data, "tail").unwrap();
        match tail {
            1 => Some(Tail::OneSided),
            2 => Some(Tail::TwoSided),
            _ => None,
        }
    }
}

impl TestKind {
    pub fn from_str(text: &str, data: &Value) -> Result<TestKind, String> {
        match text {
            "oneSampleTTest" => Ok(TestKind::OneSampleTTest),
            "independentSamplesTTest" => Ok(TestKind::IndependentSamplesTTest),
            "dependentSamplesTTest" => Ok(TestKind::DependentSamplesTTest),
            "goodnessOfFitChisqTest" => {
                let df = parse_i64(data, "df").unwrap();
                Ok(TestKind::GoodnessOfFitChisqTest { df })
            }
            "deviationFromZeroMultipleRegression" => {
                let n_predictors = parse_i64(data, "nPredictors").unwrap();
                Ok(TestKind::DeviationFromZeroMultipleRegression { n_predictors })
            }
            "increaseMultipleRegression" => {
                let rho = parse_i64(data, "rho").unwrap();
                let q = parse_i64(data, "q").unwrap();
                Ok(TestKind::IncreaseMultipleRegression { rho, q })
            }
            "ANCOVA" => {
                let k = parse_i64(data, "k").unwrap();
                let q = parse_i64(data, "q").unwrap();
                let p = parse_i64(data, "p").unwrap();
                Ok(TestKind::ANCOVA { k, q, p })
            }
            "oneWayANOVA" => {
                let k = parse_i64(data, "k").unwrap();
                Ok(TestKind::OneWayANOVA { k })
            }
            "twoWayANOVA" => {
                let k = parse_i64(data, "k").unwrap();
                let q = parse_i64(data, "q").unwrap();
                Ok(TestKind::TwoWayANOVA { k, q })
            }
            "betweenRepeatedANOVA" => {
                let k = parse_i64(data, "k").unwrap();
                let m = parse_i64(data, "m").unwrap();
                let rho = parse_f64(data, "rho").unwrap();
                Ok(TestKind::BetweenRepeatedANOVA { k, m, rho })
            }
            "withinRepeatedANOVA" => {
                let k = parse_i64(data, "k").unwrap();
                let m = parse_i64(data, "m").unwrap();
                let rho = parse_f64(data, "rho").unwrap();
                let epsilon = parse_f64(data, "epsilon").unwrap();
                if epsilon < (1.0 / (m as f64 - 1.0)) {
                    Err(
                        "lower bound of ε corresponds to 1 / (number of measurements - 1)"
                            .to_string(),
                    )
                } else {
                    Ok(TestKind::WithinRepeatedANOVA { k, m, rho, epsilon })
                }
            }
            "withinBetweenRepeatedANOVA" => {
                let k = parse_i64(data, "k").unwrap();
                let m = parse_i64(data, "m").unwrap();
                let rho = parse_f64(data, "rho").unwrap();
                let epsilon = parse_f64(data, "epsilon").unwrap();
                if epsilon < (1.0 / (m as f64 - 1.0)) {
                    Err(
                        "lower bound of ε corresponds to 1 / (number of measurements - 1)"
                            .to_string(),
                    )
                } else {
                    Ok(TestKind::WithinBetweenRepeatedANOVA { k, m, rho, epsilon })
                }
            }
            "hotellingsOneGroup" => {
                let p = parse_i64(data, "p").unwrap();
                Ok(TestKind::HotellingsOneGroup { p })
            }
            "hotellingsTwoGroups" => {
                let p = parse_i64(data, "p").unwrap();
                Ok(TestKind::HotellingsTwoGroups { p })
            }
            "manovaGlobalEffects" => {
                let p = parse_i64(data, "p").unwrap();
                let k = parse_i64(data, "k").unwrap();
                Ok(TestKind::MANOVAGlobalEffects { p, k })
            }
            "twoIndependentCorrelations" => Ok(TestKind::TwoIndependentCorrelations),
            "twoDependentCorrelationsCommon" => {
                let n_common = parse_i64(data, "nCommon").unwrap();
                Ok(TestKind::TwoDependentCorrelationsCommon { n_common })
            }
            "twoDependentCorrelationsNoCommon" => {
                Ok(TestKind::TwoDependentCorrelationsNoCommon)
            }
            "logisticRegression" => {
                let p0 = parse_f64(data, "p0").unwrap();
                let r2 = parse_f64(data, "r2").unwrap();
                Ok(TestKind::LogisticRegression { p0, r2 })
            }
            _ => Err(format!("Unknown test: {}", text)),
        }
    }

    fn alternative_distribution(&self, n: f64, es: f64) -> Dist {
        match self {
            TestKind::OneSampleTTest => Box::new(NoncentralT::new(n - 1.0, n.sqrt() * es)),
            TestKind::IndependentSamplesTTest => {
                let v = n - 2.0; // n1 + n2 - 2
                Box::new(NoncentralT::new(v, (n / 2.0).sqrt() * es))
            }
            TestKind::DependentSamplesTTest => {
                // Paired t-test: df = n-1, lambda = sqrt(n) * d
                // Same distribution as one-sample t-test on the differences
                Box::new(NoncentralT::new(n - 1.0, n.sqrt() * es))
            }
            TestKind::DeviationFromZeroMultipleRegression { n_predictors } => {
                Box::new(NoncentralF::new(
                    *n_predictors as f64,
                    n - (*n_predictors as f64) - 1.0,
                    es.powi(2) * n,
                ))
            }
            TestKind::GoodnessOfFitChisqTest { df } => {
                Box::new(NoncentralChisq::new(*df as f64, es.powi(2) * n))
            }
            TestKind::IncreaseMultipleRegression { rho, q } => Box::new(NoncentralF::new(
                *q as f64,
                n - (*rho as f64) - 1.0,
                es.powi(2) * n,
            )),
            TestKind::ANCOVA { k, q, p } => Box::new(NoncentralF::new(
                *q as f64,
                n - *k as f64 - *p as f64 - 1.0,
                es.powi(2) * n,
            )),
            TestKind::OneWayANOVA { k } => Box::new(NoncentralF::new(
                *k as f64 - 1.0,
                n - *k as f64,
                es.powi(2) * n,
            )),
            TestKind::TwoWayANOVA { k, q } => {
                Box::new(NoncentralF::new(*q as f64, n - *k as f64, es.powi(2) * n))
            }

            TestKind::BetweenRepeatedANOVA { k, m, rho } => {
                let u = *m as f64 / (1.0 + ((*m as f64 - 1.0) * *rho));
                Box::new(NoncentralF::new(
                    *k as f64 - 1.0,
                    n - *k as f64,
                    es.powi(2) * u * n,
                ))
            }
            TestKind::WithinRepeatedANOVA { k, m, rho, epsilon } => {
                let u = *m as f64 / (1.0 - *rho);
                Box::new(NoncentralF::new(
                    (*m as f64 - 1.0) * *epsilon,
                    (n - *k as f64) * (*m as f64 - 1.0) * *epsilon,
                    es.powi(2) * u * n * *epsilon, // G*Power paper is missing the epsilon.
                ))
            }
            TestKind::WithinBetweenRepeatedANOVA { k, m, rho, epsilon } => {
                let u = *m as f64 / (1.0 - *rho);
                Box::new(NoncentralF::new(
                    (*k as f64 - 1.0) * (*m as f64 - 1.0) * *epsilon,
                    (n - *k as f64) * (*m as f64 - 1.0) * *epsilon,
                    es.powi(2) * u * n * *epsilon,
                ))
            }

            // Hotelling's T²: One group mean vector
            // F(p, n-p) with noncentrality = n * d² (Mahalanobis distance squared)
            TestKind::HotellingsOneGroup { p } => {
                let pf = *p as f64;
                Box::new(NoncentralF::new(pf, n - pf, es.powi(2) * n))
            }

            // Hotelling's T²: Two group mean vectors
            // F(p, n-p-1) with noncentrality = (n/2) * d²
            // n is total sample size (n1+n2), assuming equal groups
            TestKind::HotellingsTwoGroups { p } => {
                let pf = *p as f64;
                Box::new(NoncentralF::new(pf, n - pf - 1.0, es.powi(2) * n / 2.0))
            }

            // MANOVA: Global effects using Pillai's trace F-approximation
            // Based on Muller & Barton (1989) and G*Power's implementation.
            // s = min(p, k-1), m = (|p - (k-1)| - 1) / 2
            // df1 = s * (2m + s + 1), df2 = s * (2n_star + s + 1)
            // where n_star = (N - k - p) / 2
            // noncentrality = df1 * f² * N / s
            TestKind::MANOVAGlobalEffects { p, k } => {
                let pf = *p as f64;
                let df_h = *k as f64 - 1.0; // hypothesis df
                let s = if pf < df_h { pf } else { df_h };
                let m = ((pf - df_h).abs() - 1.0) / 2.0;
                let n_star = (n - *k as f64 - pf) / 2.0;
                let df1 = s * (2.0 * m + s + 1.0);
                let df2 = s * (2.0 * n_star + s + 1.0);
                let ncp = es.powi(2) * n * df1 / s;
                Box::new(NoncentralF::new(df1, df2, ncp))
            }

            // z-test: Two independent Pearson correlations
            // Uses Fisher's z-transform: z = 0.5 * ln((1+r)/(1-r))
            // The effect size 'es' is q = z1 - z2 (difference of Fisher z-transformed correlations)
            // Test statistic: Z = q * sqrt((n1-3)(n2-3)/(n1+n2-6))
            // For equal n: Z = q * sqrt((n-3)/2)
            TestKind::TwoIndependentCorrelations => {
                let ncp = es * ((n - 3.0) / 2.0).sqrt();
                Box::new(NormalDist::new(ncp, 1.0))
            }

            // z-test: Two dependent Pearson correlations (common index)
            // Effect size 'es' is q = z_r12 - z_r13
            // The variance depends on the correlation r23 between the two non-common variables
            // Simplified: lambda ~ es * sqrt(n / (2*(1-r23)))
            // Here n_common is the sample size
            TestKind::TwoDependentCorrelationsCommon { n_common } => {
                let nf = *n_common as f64;
                let ncp = es * (nf / 2.0).sqrt();
                Box::new(NormalDist::new(ncp, 1.0))
            }

            // z-test: Two dependent Pearson correlations (no common index)
            // Effect size 'es' is q = z_r12 - z_r34
            // Simpler case: lambda ~ es * sqrt((n-3)/2)
            TestKind::TwoDependentCorrelationsNoCommon => {
                let ncp = es * ((n - 3.0) / 2.0).sqrt();
                Box::new(NormalDist::new(ncp, 1.0))
            }

            // z-test: Logistic regression
            // Based on Demidenko (2007) and G*Power's implementation.
            // The effect size 'es' is the odds ratio.
            // p0 = probability of event under H0
            // r2 = R² of other covariates with the predictor
            // lambda = sqrt(n * p0 * (1-p0) * (1-r2)) * ln(OR)
            TestKind::LogisticRegression { p0, r2 } => {
                let ln_or = es.ln();
                let ncp = ln_or * (n * p0 * (1.0 - p0) * (1.0 - r2)).sqrt();
                Box::new(NormalDist::new(ncp, 1.0))
            }
        }
    }

    fn null_distribution(&self, n: f64, es: f64) -> Dist {
        self.alternative_distribution(n, es).central_distribution()
    }

    pub fn n(&self, tail: Tail, alpha: f64, power: f64, es: f64) -> i64 {
        let f = |n| self.alpha(tail.clone(), n, power, es) - alpha;
        let mut conv = SimpleConvergency {
            eps: 0.0001f64,
            max_iter: 500,
        };
        let step_size = 20;
        // There is probably a better way to do this, but it works.
        for lower in (0..1000).step_by(step_size) {
            let upper = lower + step_size;
            let root = find_root_regula_falsi(lower as f64, upper as f64, f, &mut conv);
            let n = root.unwrap_or(-111.0);
            if n == -111.0 || n.is_nan() {
                continue;
            }
            return n.ceil() as i64;
        }
        -111
    }

    pub fn alpha(&self, tail: Tail, n: f64, power: f64, es: f64) -> f64 {
        let d0 = self.null_distribution(n, es);
        let d1 = self.alternative_distribution(n, es);
        let critical_value = d1.quantile(power, false);
        let right_tail = d0.cdf(critical_value, false);
        match tail {
            Tail::OneSided => right_tail,
            Tail::TwoSided => 2.0 * right_tail,
        }
    }

    pub fn power(&self, tail: Tail, n: f64, alpha: f64, es: f64) -> f64 {
        let d0 = self.null_distribution(n, es);
        let d1 = self.alternative_distribution(n, es);
        let right_tail = match tail {
            Tail::OneSided => alpha,
            Tail::TwoSided => alpha / 2.0,
        };
        let critical_value = d0.quantile(right_tail, false);
        d1.cdf(critical_value, false)
    }

    pub fn es(&self, tail: Tail, n: f64, alpha: f64, power: f64) -> f64 {
        let f = |es| self.alpha(tail.clone(), n, power, es) - alpha;
        let mut conv = SimpleConvergency {
            eps: 0.0001f64,
            max_iter: 500,
        };
        let root = find_root_regula_falsi(0.001f64, 8f64, f, &mut conv);
        root.unwrap_or(-111.0)
    }

    /// Compromise analysis: given n, es, and β/α ratio, find α and power simultaneously.
    /// Returns (alpha, power).
    pub fn compromise(&self, tail: Tail, n: f64, es: f64, beta_alpha_ratio: f64) -> (f64, f64) {
        // We need to find α such that β/α = beta_alpha_ratio
        // β = 1 - power, so (1 - power) / α = beta_alpha_ratio
        // Equivalently: power = 1 - α * beta_alpha_ratio
        let f = |alpha: f64| {
            let power_at_alpha = self.power(tail.clone(), n, alpha, es);
            let beta = 1.0 - power_at_alpha;
            // We want beta / alpha = beta_alpha_ratio
            beta - alpha * beta_alpha_ratio
        };
        let mut conv = SimpleConvergency {
            eps: 0.00001f64,
            max_iter: 1000,
        };
        let alpha = find_root_regula_falsi(0.0001f64, 0.9999f64, f, &mut conv)
            .unwrap_or(-111.0);
        if alpha == -111.0 || alpha.is_nan() {
            return (-111.0, -111.0);
        }
        let power = self.power(tail, n, alpha, es);
        (alpha, power)
    }

    /// Monte Carlo simulation-based power analysis.
    /// Generates `n_sim` random samples and computes empirical power.
    /// Returns (empirical_power, p_values_histogram) where histogram has 20 bins [0, 1].
    pub fn simulate_power(
        &self,
        tail: Tail,
        n: f64,
        alpha: f64,
        es: f64,
        n_sim: u64,
        seed: u64,
    ) -> (f64, Vec<u64>) {
        let mut rng = ChaCha8Rng::seed_from_u64(seed);
        let d0 = self.null_distribution(n, es);
        let d1 = self.alternative_distribution(n, es);

        let right_tail_alpha = match tail {
            Tail::OneSided => alpha,
            Tail::TwoSided => alpha / 2.0,
        };
        let _critical_value = d0.quantile(right_tail_alpha, false);

        let mut rejections: u64 = 0;
        let n_bins: usize = 20;
        let mut histogram = vec![0u64; n_bins];

        for _ in 0..n_sim {
            // Generate a random test statistic from the alternative distribution
            // using the inverse CDF method (probability integral transform)
            let u: f64 = rng.gen_range(0.0001f64..0.9999f64);
            let test_stat = d1.quantile(u, true);

            // Compute p-value under the null
            let p_value = match tail {
                Tail::OneSided => d0.cdf(test_stat, false),
                Tail::TwoSided => 2.0 * d0.cdf(test_stat.abs(), false).min(1.0),
            };

            // Record rejection
            if p_value < alpha {
                rejections += 1;
            }

            // Bin the p-value for histogram
            let bin = ((p_value.clamp(0.0, 0.9999)) * n_bins as f64) as usize;
            let bin = bin.min(n_bins - 1);
            histogram[bin] += 1;
        }

        let empirical_power = rejections as f64 / n_sim as f64;
        (empirical_power, histogram)
    }
}
