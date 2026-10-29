# Guide de l’équipe commerciale

Ce guide couvre tout ce qu’il faut pour créer, lancer et clôturer un concours sans développeur. L’administration se trouve sur **https://vanidel.izakcodes.com/admin**.

## 1. Se connecter

- Connectez-vous avec l’e-mail et le mot de passe donnés par l’administrateur.
- La langue de l’administration (français, anglais ou arabe) se choisit dans votre compte, en haut à droite.
- Le rôle **Commercial** permet tout ce qui est décrit ici. Supprimer un concours ou un média, et gérer les comptes, est réservé à l’administrateur.
- La page d’accueil (**Tableau de bord**) montre :
  - **En direct** : chaque concours ouvert ou à venir, avec ses participations (au total, aujourd’hui, numéros uniques) et les liens **Modifier**, **Voir la page** et **Rapport (CSV)**.
  - **À faire** : les tirages à lancer, les gagnants à publier et les brouillons qui ne peuvent pas encore être publiés. Chaque ligne mène à l’endroit où le faire.
  - **Actions rapides** : nouveau concours, lien de campagne, export des participations, médias.

## 2. Créer un concours

Le plus simple est de partir du concours précédent : ouvrez-le, menu **⋮ › Dupliquer**. La copie est un **brouillon** nommé `…-copie`, avec les textes dans les deux langues, les étapes, les lots, les consentements et les réglages. Sinon : **Concours › Créer**.

Les textes se saisissent une langue à la fois : changez de langue avec **Paramètres régionaux** en haut de la page, puis enregistrez dans chaque langue.

**Onglet Contenu**

- Titre et description. En français, tapez une espace insécable avant « : », « ! » et « ? », et dans les montants (« 10 000 DA ») : sinon la ponctuation ou « DA » peut passer seule à la ligne. Sur Mac : Option + Espace ; sur Windows : Alt + 0160.
- **Comment participer** : les étapes, affichées numérotées. Au moins une.
- **Visuel principal** (image large, 16/9). Sur ordinateur, il s’affiche à côté du titre et peut être recadré : gardez l’essentiel au centre. Sans visuel, le haut de la page devient un bandeau rouge.
- **Règlement (PDF)** : un fichier par langue.
- **Lots** : titre, description, image et quantité.

**Onglet Participation**

- **E-mail** : non demandé, facultatif ou obligatoire. **Wilaya obligatoire** ou non. Le nom, le téléphone et la photo du ticket sont toujours demandés.
- **Participations max. par téléphone et par période**.
- **Consentements** : gardez au moins le règlement et le traitement des données, cochés « Obligatoire ». Dès qu’un texte change, changez sa **Version du texte** (par exemple `r2`) : c’est la preuve du texte accepté par chaque participant.

**Onglet Tirages**

- **Durée d’une période** (7 jours = tirage hebdomadaire), **Premier jour de la période** et **Gagnants par tirage**.
- Ne les modifiez plus une fois le premier tirage fait.

**Onglet Partage et SEO**

- Titre et description SEO dans chaque langue : ce qui s’affiche sur Google et dans les aperçus de lien.
- **Image de partage (1200×630)** : l’image des aperçus de lien (WhatsApp, Facebook…). Sur téléphone, le bouton Instagram l’envoie aussi telle quelle en story ou en publication. À défaut, le visuel principal est utilisé.

**Colonne de droite**

- **Identifiant URL** : l’adresse du concours, `/concours/{identifiant}`. Choisissez-le court (par exemple `ete-2027`) : **ne le changez plus une fois les QR codes imprimés**.
- **Début** et **Fin** : heure d’Alger.

## 3. Vérifier avant de publier

- L’encadré **Avant de publier**, en haut de la colonne de droite, liste ce qui manque. Il se met à jour à chaque enregistrement. Les textes manquants dans une langue (✗, obligatoire) empêchent de publier ; les autres points (!) sont recommandés.
- L’icône **Aperçu** (carré avec une flèche, à côté de **Sauvegarder**) ouvre la page du concours telle qu’elle sera publiée, dans la langue affichée, même en brouillon. Seule l’équipe la voit. Quittez l’aperçu avec le bouton du bandeau.

## 4. Publier

- Passez le **Statut** à **Publié** et cliquez sur **Sauvegarder**.
- Le concours apparaît sur le site et accepte les participations **entre les dates de début et de fin**, automatiquement. Publié avant la date de début, il s’affiche comme « Ouverture le … ».

## 5. Liens de campagne et QR codes

**Concours › Liens de campagne › Créer** : un lien par canal pour savoir d’où viennent les participants.

- Choisissez le concours et le **Canal** : QR code emballage, affiche, Facebook, Instagram, TikTok, influenceur ou autre.
- **Code** : distingue les liens d’un même canal, par exemple le nom de l’influenceur ou le lieu de l’affiche. Obligatoire pour « Influenceur » et « Autre ».
- Après l’enregistrement, la page du lien affiche l’adresse à copier et le QR code à télécharger : **PNG** pour l’écran, **SVG** pour l’impression.
- Donnez à chaque influenceur et à chaque réseau **son** lien. Les boutons de partage du site, proposés après la participation, sont comptés à part (« whatsapp », « instagram », « share »).

## 6. Pendant le concours

- **Participations › Participations** : la liste, filtrable par concours, période, wilaya et canal. Cliquez sur la miniature du ticket pour voir la photo entière.
- **Exporter (CSV)**, au-dessus de la liste : par concours et par dates. Le fichier s’ouvre dans Excel.
- Une participation n’est jamais modifiée. Une participation non conforme se **supprime** : cochez-la dans la liste (ou ouvrez-la), puis **Supprimer**. Elle part dans la **Corbeille** : elle disparaît de la liste, des chiffres, des exports et des tirages. En cas d’erreur, demandez à l’administrateur de la **restaurer** ; lui seul peut restaurer ou supprimer définitivement.
- Une participation déjà tirée au sort ne peut pas être supprimée : un gagnant refusé se traite par un nouveau tirage (section 7).

## 7. Tirages et gagnants

**Lancer un tirage** : **Concours › Tirages**, encadré **Lancer un tirage** en haut de la liste. Choisissez la période (seules les périodes terminées sont proposées), puis **Lancer le tirage**. Chaque période ne se tire **qu’une fois** ; le tirage est enregistré pour preuve.

**Vérifier le gagnant** : ouvrez-le dans **Concours › Gagnants**, contrôlez la photo de son ticket et contactez-le.

**Gagnant invalide ou injoignable** : dans sa fiche, section **Annulation**, saisissez le motif puis **Annuler et retirer au sort**. Un remplaçant est tiré parmi les participations de la même période qui n’ont pas déjà été tirées. L’annulation est définitive.

**Publier le gagnant** : dans sa fiche, section **Publication** :

- **Nom affiché** : déjà masqué (par exemple « Amine B. »). Ne mettez jamais le nom complet ni le téléphone.
- **Photo ou vidéo** : seulement avec l’accord écrit du gagnant. Vidéo en MP4 ou WebM, 10 Mo au plus.
- Cochez **Publié** et enregistrez. Le gagnant apparaît sur la page du concours et dans les archives.

## 8. Rapport du concours

Dans le concours, onglet **Rapport** :

- Participations, numéros uniques et participants qui acceptent les offres.
- Répartition **par canal** (avec le nom de vos liens de campagne, y compris ceux qui n’ont encore rien apporté), **par wilaya** et **par période**.
- Tirages, re-tirages et gagnants publiés.
- **Télécharger le rapport (CSV)** pour le joindre à un bilan.

Les visites du site se consultent dans Google Analytics et Meta ; le rapport compte les participations enregistrées.

## 9. Contacts marketing

**Participations › Contacts**, bouton **Exporter les contacts marketing (CSV)** : uniquement les personnes dont le dernier choix est d’accepter les offres, avec leurs coordonnées les plus récentes. Tous les contacts, ou ceux d’un concours.

## 10. Clôturer un concours

1. À la date de fin, les participations s’arrêtent d’elles-mêmes.
2. Faites les tirages restants et publiez les derniers gagnants.
3. Passez le **Statut** à **Archivé**. Le concours reste visible dans **Concours passés** (`/fr/concours/archives`, `/ar/concours/archives`), avec ses gagnants.

## À ne pas faire

- Changer l’identifiant URL d’un concours dont les QR codes sont imprimés.
- Changer le texte d’un consentement sans changer sa version.
- Modifier les réglages de tirage après le premier tirage.
- Publier une photo, une vidéo ou un nom complet sans l’accord du gagnant.

Pour tout problème technique, ou pour créer un compte : contactez l’administrateur.
