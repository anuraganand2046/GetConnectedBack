const expect= require('chai').expect;
const authMiddleware= require('../middleware/is-auth');
it('should throw an error if no authorization is present', function(){
    const req= {
        get: function(headerName){
            return null;
        }
    }
    expect(authMiddleware.bind(this, req, {}, ()=>{})).to.throw(
        'Not authorized'
    )
})
it('should throw an error if the authorization header is only one string', function(){
    const req= {//dummy request object.
        get: function(headerName){
            return 'xyz';
        }
    }
    expect(authMiddleware.bind(this, req, {}, ()=>{})).to.throw()
})