import { loadKnowledgeResult } from '../lib/knowledge/load';

const checkKnowledge = (): void => {
    const { data, errors, warnings } = loadKnowledgeResult();

    console.log(
        `categories ${data.categories.length}, concepts ${data.concepts.length}, ` +
            `relations ${data.relations.length}, articles ${data.articles.length}`,
    );
    warnings.forEach((warning) => console.warn(`[warn] ${warning}`));
    errors.forEach((error) => console.error(`[error] ${error}`));

    if (errors.length > 0) {
        process.exit(1);
    }
};

checkKnowledge();
