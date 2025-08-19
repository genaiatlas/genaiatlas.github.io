# run_lda.py
import os
import json
import argparse
import csv
import numpy as np
from sklearn.decomposition import LatentDirichletAllocation
from sklearn.feature_extraction.text import CountVectorizer

# Optional visualization (only if available in the environment)
HAS_VIZ = True
try:
    import pyLDAvis
    import pyLDAvis.sklearn
except Exception:
    HAS_VIZ = False


def topk_unique(scores: np.ndarray, k: int, texts, snippet_len: int = 120):
    """
    Return up to k indices with highest scores, de-duplicated by a simple
    first-N-chars fingerprint of each text (to avoid near-duplicates).
    """
    if k <= 0:
        return []
    k = min(k, scores.shape[0])
    # Fast top-k (unsorted), then sort those descending
    idx = np.argpartition(scores, -k)[-k:]
    idx = idx[np.argsort(scores[idx])][::-1]
    seen, out = set(), []
    for i in idx:
        key = texts[i][:snippet_len]
        if key not in seen:
            seen.add(key)
            out.append(i)
        if len(out) == k:
            break
    return out


def main():
    p = argparse.ArgumentParser(description="LDA topic modeling on MIT case-study papers")
    p.add_argument("--topics", type=int, default=5, help="Number of topics (n_components)")
    p.add_argument("--max_df", type=float, default=0.95, help="Ignore very common terms (> max_df)")
    p.add_argument("--min_df", type=int, default=2, help="Ignore very rare terms (< min_df docs)")
    p.add_argument("--max_features", type=int, default=20000, help="Vocabulary cap")
    p.add_argument("--ngrams", type=int, choices=[1, 2], default=1, help="1=unigrams, 2=uni+bi")
    p.add_argument("--words-per-topic", type=int, default=12, help="Terms to print per topic")
    p.add_argument("--csv-words", type=int, default=20, help="Terms to save per topic in CSV")
    p.add_argument("--save-csv", default="", help="Path to save topic-term CSV (omit to skip)")
    p.add_argument("--top-docs", type=int, default=0, help="Show top-K docs per topic (0=skip)")
    p.add_argument("--save-doc-topics", default="", help="Path to save doc→topic scores CSV (omit to skip)")
    p.add_argument("--out", default="lda_topics.html", help="HTML file for pyLDAvis (if available)")
    p.add_argument("--mds", choices=["mmds", "tsne"], default="mmds", help="Embedding for pyLDAvis")
    args = p.parse_args()

    ROOT = os.path.dirname(__file__)
    data_file = os.path.join(ROOT, "data", "papers")
    if not os.path.exists(data_file):
        raise FileNotFoundError(f"Missing data file: {data_file}")

    # Load documents (list[str])
    with open(data_file, "r") as f:
        papers = json.load(f)

    # Vectorize
    vectorizer = CountVectorizer(
        max_df=args.max_df,
        min_df=args.min_df,
        max_features=args.max_features,
        stop_words="english",
        ngram_range=(1, args.ngrams),
    )
    X = vectorizer.fit_transform(papers)

    # Fit LDA
    lda = LatentDirichletAllocation(
        n_components=args.topics,
        learning_method="batch",
        random_state=0,
    ).fit(X)

    # ---- Print top words per topic ----
    feature_names = vectorizer.get_feature_names_out()
    for k, topic in enumerate(lda.components_):
        top = topic.argsort()[-args.words_per_topic:][::-1]
        terms = ", ".join(feature_names[i] for i in top)
        print(f"\nTopic {k+1}: {terms}")

    # ---- Save topic-term CSV (optional) ----
    if args.save_csv:
        with open(args.save_csv, "w", newline="") as f:
            w = csv.writer(f)
            w.writerow(["topic", "rank", "term"])
            for k, topic in enumerate(lda.components_):
                top = topic.argsort()[-args.csv_words:][::-1]
                for r, i in enumerate(top, start=1):
                    w.writerow([k + 1, r, feature_names[i]])
        print(f"\nSaved topic-term CSV: {args.save_csv}")

    # ---- Doc-topic distribution ----
    doc_topic = lda.transform(X)

    # Save doc→topic CSV (optional)
    if args.save_doc_topics:
        with open(args.save_doc_topics, "w", newline="") as f:
            w = csv.writer(f)
            header = ["doc_index"] + [f"topic_{i+1}" for i in range(lda.n_components)]
            w.writerow(header)
            for i, row in enumerate(doc_topic):
                w.writerow([i] + [f"{v:.6f}" for v in row])
        print(f"Saved doc→topic CSV: {args.save_doc_topics}")

    # Show top-K docs per topic (optional)
    if args.top_docs > 0:
        for t in range(doc_topic.shape[1]):
            top_idx = topk_unique(doc_topic[:, t], args.top_docs, papers)
            print(f"\nTop {args.top_docs} docs for Topic {t+1}:")
            for i in top_idx:
                snippet = papers[i][:140].replace("\n", " ")
                print(f"  • Doc {i}: {snippet}...")

    # ---- Visualization (optional & guarded) ----
    if HAS_VIZ:
        print(f"\nSaving interactive visualization to: {args.out}")
        vis = pyLDAvis.sklearn.prepare(lda, X, vectorizer, mds=args.mds)
        pyLDAvis.save_html(vis, args.out)
        print("Done. Open the HTML in a browser.")
    else:
        print("\n(pyLDAvis not installed in this environment; printed topics only.)")


if __name__ == "__main__":
    main()