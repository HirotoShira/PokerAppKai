module.exports.isloggedIn = (req, res, next) => {
    console.log('req.user', req.user);
    if(!req.isAuthenticated()) {
        req.flash('error', 'ログインしてください');
        return res.redirect('/login');
    }
    next();
};

module.exports.isAdmin = (req, res, next) => {
    if(req.user.role !== 'admin') {
        req.flash('error', '管理者権限がありません');
        return res.redirect('/platform');
    }
    next();
}