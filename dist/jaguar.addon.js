(function () { /** @globals */
    if (typeof Box2D === "undefined") {
        return;
    }
    
    var b2Vec2 = Box2D.Common.Math.b2Vec2
        , b2AABB = Box2D.Collision.b2AABB
        , b2BodyDef = Box2D.Dynamics.b2BodyDef
        , b2Body = Box2D.Dynamics.b2Body
        , b2FixtureDef = Box2D.Dynamics.b2FixtureDef
        , b2Fixture = Box2D.Dynamics.b2Fixture
        , b2World = Box2D.Dynamics.b2World
        , b2MassData = Box2D.Collision.Shapes.b2MassData
        , b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
        , b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
        , b2DebugDraw = Box2D.Dynamics.b2DebugDraw
        , b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef
        , b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef;
        
    /**
     * Box2d를 쉽게 사용할 수 있는 클래스
     * Box2d-web 라이브러리가 필요하며 라이브러리는 <a href="http://code.google.com/p/box2dweb/" target="_blank">http://code.google.com/p/box2dweb/</a> 에서 다운로드 받을 수 있습니다.
     */
    collie.Box2d = collie.Class(/** @lends collie.Box2d.prototype */{
        ITERATIONS_VELOCITY : 6, // 속도 체크의 정확도, 높을 수록 정확하다
        ITERATIONS_POSITION : 3, // 위치 체크의 정확도, 높을 수록 정확하다
        WIDTH_OF_WALL : 10, // 벽의 두께(px)
        
        /**
         * Box2d를 쉽게 사용할 수 있는 클래스
         * Box2d-web 라이브러리가 필요하며 라이브러리는 <a href="http://code.google.com/p/box2dweb/" target="_blank">http://code.google.com/p/box2dweb/</a> 에서 다운로드 받을 수 있습니다.
         * 
         * @example
         * var layer = new collie.Layer({
         *  width: 300,
         *  height: 300
         * });
         * 
         * var box2d = new collie.Box2d(layer.option("width"), layer.option("height"), 10);
         * box2d.addFixture("normal", {
         *  density: 1.0,
         *  friction: 0.5,
         *  restitution: 0.2
         * });
         * 
         * box2d.createWall("right");
         * box2d.createWall("left");
         * box2d.createWall("top");
         * box2d.createWall("bottom", "ground");
         * 
         * var box = new DisplayObject({
         *  x: "center",
         *  y: "center",
         *  width: 100,
         *  height: 100,
         *  backgroundColor: "red"
         * }).addTo(layer);
         * 
         * box2d.createObject(box, {
         *  type: "dynamic"
         * }, "normal");
         * 
         * collie.Renderer.addLayer(layer);
         * collie.Renderer.load(document.getElementById("contianer"));
         * collie.Renderer.start();
         *  
         * @class collie.Box2d
         * @version 0.0.1
         * @see http://code.google.com/p/box2dweb/
         * @see http://www.box2dflash.org/docs/2.1a/reference/
         * @requires collie.addon.js
         * @requires box2d-web-2.1.a.3.js
         * @param {Number} nWidth 스테이지 너비(px)
         * @param {Number} nHeight 스테이지 높이(px)
         * @param {Number} [nGravity=10] 중력
         * @constructs
         */
        $init : function (nWidth, nHeight, nGravity) {
            this._oDebugLayer = null;
            this._oDebugDraw = null;
            this._bIsLoaded = false;
            this._bIsDebug = false;
            this._nStep = 60;
            this._nWidth = 0;
            this._nHeight = 0;
            this._htFixtures = {};
            this._htBodies = {};
            nGravity = typeof nGravity !== "undefined" ? nGravity : nGravity || 10;
            this._htWall = {};
            this._oWorld = this.createWorld(nGravity);
            this._fOnProcess = this._onProcess.bind(this);
            this.resize(nWidth, nHeight);
        },
        
        /**
         * displayObject로 body를 찾는다
         * 
         * @param {collie.DisplayObject} oDisplayObject
         * @return {Box2D.Dynamics.b2Body}
         */
        getBody : function (oDisplayObject) {
            var nId = oDisplayObject.getId();
            return this._htBodies[nId] || false;
        },
        
        /**
         * Body로 displayObject를 반환한다. index를 사용하지 않기 때문에 속도에 문제가 있을 수 있다.
         * 
         * @param {Box2D.Dynamics.b2Body} oBody
         * @return {collie.DisplayObject}
         */
        getDisplayObjectByBody : function (oBody) {
            for (var i in this._htBodies) {
                if (this._htBodies[i] === oBody) {
                    return collie.util.getDisplayObjectById(i);
                }
            } 
        },
        
        /**
         * Fixture를 추가한다
         * 
         * @param {String} sName Fixture 이름
         * @param {Option} htOption Fixture 옵션
         * @param {Number} htOption.friction 마찰력 0~1, 0이면 마찰력이 없다
         * @param {Number} htOption.restitution 반발력 0~1, 0이면 비탄성충돌, 튀기지 않는다
         * @param {Box2D.Collision.Shapes.b2PolygonShape|Box2D.Collision.Shapes.b2CircleShape} [oShape] shape도 지정할 경우 입력
         */
        addFixture : function (sName, htOption, oShape) {
            if (oShape) {
                htOption.shape = oShape;
            }
            
            var fixture = this.createFixture(htOption);
            this._htFixtures[sName] = fixture;
        },
        
        /**
         * 등록된 Fixture를 지움
         * 
         * @param {String} sName Fixture 이름
         */
        removeFixture : function (sName) {
            delete this._htFixtures[sName];
        },
        
        /**
         * 등록된 Fixture를 반환
         * 
         * @param {String} sName Fixture 이름
         * @return {Box2D.Dynamics.b2FixtureDef|Boolean}
         */
        getFixture : function (sName) {
            if (this._htFixtures[sName]) {
                var fixture = new b2FixtureDef();
                
                for (var i in this._htFixtures[sName]) {
                    fixture[i] = this._htFixtures[sName][i];
                }
                
                return fixture;
            } else {
                return false;
            }
        },
        
        /**
         * b2FixtureDef를 생성
         * @param {Object} htOption
         * @return {Box2D.Dynamics.b2FixtureDef}
         */
        createFixture : function (htOption) {
            var fixture = new b2FixtureDef();
            fixture.density = typeof htOption.density !== "undefined" ? htOption.density : fixture.density;
            fixture.filter = htOption.filter || fixture.filter;
            fixture.friction = typeof htOption.friction !== "undefined" ? htOption.friction : fixture.friction;
            fixture.restitution = typeof htOption.restitution !== "undefined" ? htOption.restitution : fixture.restitution;
            fixture.isSensor = htOption.isSensor || fixture.isSensor;
            fixture.userData = htOption.userData || fixture.userData;
            fixture.shape = htOption.shape || fixture.shape;
            return fixture;
        },
        
        /**
         * b2BodyDef를 생성
         * @param {Object} htOption
         * @param {String} [htOption.type="dynamic"] body 타입 static, dynamic, kinematic
         * @return {Box2D.Dynamics.b2BodyDef}
         */
        createBody : function (htOption) {
            var body = new b2BodyDef();
            body.active = htOption.active || body.active;
            body.allowSleep = htOption.allowSleep || body.allowSleep;
            body.angle = htOption.angle || body.angle;
            body.angularDamping = htOption.angularDamping || body.angularDamping;
            body.angularVelocity = htOption.angularVelocity || body.angularVelocity;
            body.awake = htOption.awake || body.awake;
            body.bullet = htOption.bullet || body.bullet;
            body.fixedRotation = htOption.fixedRotation || body.fixedRotation;
            body.inertiaScale = htOption.inertiaScale || body.inertiaScale;
            body.linearDamping = htOption.linearDamping || body.linearDamping;
            body.linearVelocity = htOption.linearVelocity || body.linearVelocity;
            body.position.x = htOption.x / collie.Box2d.SCALE || 0;
            body.position.y = htOption.y / collie.Box2d.SCALE || 0;

            switch (htOption.type) {
                case "static" :
                    body.type = b2Body.b2_staticBody;
                    break;
                    
                case "kinematic" :
                    body.type = b2Body.b2_kinematicBody;
                    break;
                
                case "dynamic" :
                default :
                    body.type = b2Body.b2_dynamicBody;
            }

            body.userData = htOption.userData || body.userData;
            return body;
        },
        
        /**
         * Box2d 객체를 생성한다
         * 
         * @param {collie.DisplayObject} oDisplayObject
         * @param {Object} htOption body options
         * @param {Number} [htOption.radius] 반지름, 이 값이 설정되면 Shape는 해당 반지름을 가지는 원으로 생성됨 
         * @param {Number} [htOption.width] 상자 너비(px) 이 값이 설정되면 Shape는 상자로 생성됨 
         * @param {Number} [htOption.height] 상자 높이(px) 이 값이 설정되면 Shape는 상자로 생성됨 
         * @param {String} [htOption.type="dynamic"] Body 종류, static(고정), dynamic(움직임), kinematic(움직이지만 다른 body에 영향이 없음) 
         * @param {Number} [htOption.groupIndex] 충돌 그룹을 지정할 수 있다. 양수와 음수를 쓸 수 있으며 같은 양수의 index끼리는 충돌하고, 같은 음수의 index끼리는 충돌하지 않는다 
         * @param {Number} [htOption.userData] UserData 
         * @param {String|Box2D.Dynamics.b2FixtureDef} vFixture addFixture로 추가한 이름이나 FixtureDef를 입력
         * @return {Box2D.Dynamics.b2Body}
         */
        createObject : function (oDisplayObject, htOption, vFixture) {
            var htInfo = oDisplayObject.get();
            var nId = oDisplayObject.getId();
            htOption.x = htInfo.x + htInfo.width / 2;
            htOption.y = htInfo.y + htInfo.height / 2;
            var bodyDef = this.createBody(htOption);
            var fixtureDef = typeof vFixture === "string" ? this.getFixture(vFixture) : vFixture;
            
            // 충돌 그룹을 설정한다
            if ("groupIndex" in htOption) {
                fixtureDef.filter.groupIndex = htOption.groupIndex;
            }
            
            // 정해진 shape가 없으면 조건에 따라 shape을 만든다
            if (!fixtureDef.shape) {
                fixtureDef.shape = this._createShape(oDisplayObject, htOption);
            }
            
            var body = this._oWorld.CreateBody(bodyDef);
            this._htBodies[nId] = body; 
            body.CreateFixture(fixtureDef);
            body._displayObjectId = nId;
            return body;
        },
        
        /**
         * DisplayObject와 관계 없는 Static Object를 생성
         * 
         * @param {Object} htOption
         * @param {Number} htOption.x 좌상단 x좌표
         * @param {Number} htOption.y 좌상단 y좌표
         * @param {Number} htOption.width
         * @param {Number} htOption.height
         * @param {String|Box2D.Dynamics.b2FixtureDef} [vFixture] addFixture로 추가한 이름이나 FixtureDef를 입력
         * @return {Box2D.Dynamics.b2Body}
         */
        createStaticObject : function (htOption, vFixture) {
            var fixtureDef;
            htOption.type = "static";
            htOption.x += htOption.width / 2; // 중심 좌표로 변환, collie는 좌상단 기준, box2d는 중심 기준 좌표를 쓰고 있기 때문
            htOption.y += htOption.height / 2;
            
            if (!vFixture) {
                fixtureDef = new b2FixtureDef();
            } else {
                fixtureDef = typeof vFixture === "string" ? this.getFixture(vFixture) : vFixture;
            }
            
            // 정해진 shape가 없으면 조건에 따라 shape을 만든다
            if (!fixtureDef.shape) {
                fixtureDef.shape = this._createShape(null, htOption);
            }
            
            var bodyDef = this.createBody(htOption);
            var body = this._oWorld.CreateBody(bodyDef);
            body.CreateFixture(fixtureDef);
            return body;
        },
        
        /**
         * 벽을 만든다
         * 
         * @param {String} sDirection 벽 방향, left, right, top, bottom
         * @param {String|Box2D.Dynamics.b2FixtureDef} [vFixture] addFixture로 추가한 이름이나 FixtureDef를 입력
         * @return {Box2D.Dynamics.b2Body}
         */
        createWall : function (sDirection, vFixture) {
            var body;
            
            switch (sDirection) {
                case "left" :
                    body = this.createStaticObject({
                        x : -this.WIDTH_OF_WALL,
                        y : -this.WIDTH_OF_WALL,
                        width : this.WIDTH_OF_WALL,
                        height : this._nHeight + this.WIDTH_OF_WALL * 2
                    }, vFixture);
                    break;
                    
                case "right" :
                    body = this.createStaticObject({
                        x : this._nWidth,
                        y : -this.WIDTH_OF_WALL,
                        width : this.WIDTH_OF_WALL,
                        height : this._nHeight + this.WIDTH_OF_WALL * 2
                    }, vFixture);
                    break;
                    
                case "top" :
                    body = this.createStaticObject({
                        x : -this.WIDTH_OF_WALL,
                        y : -this.WIDTH_OF_WALL,
                        width : this._nWidth + this.WIDTH_OF_WALL * 2,
                        height : this.WIDTH_OF_WALL
                    }, vFixture);
                    break;
                    
                case "bottom" :
                    body = this.createStaticObject({
                        x : -this.WIDTH_OF_WALL,
                        y : this._nHeight,
                        width : this._nWidth + this.WIDTH_OF_WALL * 2,
                        height : this.WIDTH_OF_WALL
                    }, vFixture);
                    break;
                    
                default :
                    throw new Error("not invalid direction");
            }
            
            this._htWall[sDirection] = body;
            return body;
        },
        
        /**
         * 등록된 객체를 제거한다
         * 
         * @param {Box2D.Dynamics.b2Body} oBody
         * @param {Boolean} bRemoveDisplayObject DisplayObject까지 같이 제거한다
         */
        removeObject : function (oBody, bRemoveDisplayObject) {
            var nId = oBody._displayObjectId;
            
            // createObject로 만들어진 객체라면
            if (nId) {
                if (bRemoveDisplayObject) {
                    collie.util.getDisplayObjectById(nId).leave();
                }
                
                delete this._htBodies[nId];
            }
            
            this._oWorld.DestroyBody(oBody);
        },
        
        /**
         * 조건에 따라 shape를 만든다
         * @private
         * @return {Box2D.Collision.Shapes.b2PolygonShape|Box2D.Collision.Shapes.b2CircleShape}
         */
        _createShape : function (oDisplayObject, htOption) {
            var shape;
            
            if (("width" in htOption) && ("height" in htOption)) {
                shape = this._createShapeBox(htOption.width / collie.Box2d.SCALE, htOption.height / collie.Box2d.SCALE);
            } else if (("radius" in htOption)) {
                shape = this._createShapeCircle(htOption.radius / collie.Box2d.SCALE);
            } else if (oDisplayObject) {
                if (oDisplayObject instanceof collie.Circle) {
                    shape = this._createShapeCircle(oDisplayObject._htOption.radius / collie.Box2d.SCALE);
                } else {
                    shape = this._createShapeBox(oDisplayObject._htOption.width / collie.Box2d.SCALE, oDisplayObject._htOption.height / collie.Box2d.SCALE);
                }
            }
            
            return shape;
        },
        
        /**
         * 사각형 Shape를 만듦
         * @private
         * @param {Number} nWidth
         * @param {Number} nHeight
         * @return {Box2D.Collision.Shapes.b2PolygonShape}
         */
        _createShapeBox : function (nWidth, nHeight) {
            var shape = new b2PolygonShape();
            shape.SetAsBox(nWidth / 2, nHeight / 2);
            return shape;
        },
        
        /**
         * 원형 shape를 만듦
         * @private
         * @param {Number} nRadius 반지름
         * @return {Box2D.Collision.Shapes.b2CircleShape}
         */
        _createShapeCircle : function (nRadius) {
            return new b2CircleShape(nRadius);
        },
        
        /**
         * Contact를 만든다
         * 
         * @param {Function} [fBeginContact]
         * @param {Function} [fEndContact]
         * @param {Function} [fPostSolve]
         * @param {Function} [fPreSolve]
         */
        createContact : function (fBeginContact, fEndContact, fPostSolve, fPreSolve) {
            var listener = new Box2D.Dynamics.b2ContactListener();
            
            if (typeof fBeginContact !== "undefined") {
                listener.BeginContact = fBeginContact;
            }
            if (typeof fEndContact !== "undefined") {
                listener.EndContact = fEndContact;
            }
            if (typeof fPostSolve !== "undefined") {
                listener.PostSolve = fPostSolve;
            }
            if (typeof fPreSolve !== "undefined") {
                listener.PreSolve = fPreSolve;
            }
            
            this._oWorld.SetContactListener(listener); 
        },
        
        /**
         * RevoluteJoint를 만든다
         * 
         * @param {Box2D.Dynamics.b2Body} oBody1 연결할 왼쪽 body 
         * @param {Box2D.Dynamics.b2Body} oBody2 연결할 오른쪽 body 
         * @param {Box2D.Common.Math.b2Vec2} oAnchor 연결점
         * @param {Object} htOption Joint 옵션
         * @return {Box2D.Dynamics.Joints.b2Joint} 생성된 Joint
         */
        createRevoluteJoint : function (oBody1, oBody2, oAnchor, htOption) {
            var oJoint = new b2RevoluteJointDef();
            htOption = htOption || {};
            oJoint.Initialize(oBody1, oBody2, oAnchor);
            oJoint.enableLimit = typeof htOption.enableLimit !== "undefined" ? htOption.enableLimit : oJoint.enableLimit; 
            oJoint.enableMotor = typeof htOption.enableMotor !== "undefined" ? htOption.enableMotor : oJoint.enableMotor; 
            oJoint.localAnchorA = typeof htOption.localAnchorA !== "undefined" ? htOption.localAnchorA : oJoint.localAnchorA; 
            oJoint.localAnchorB = typeof htOption.localAnchorB !== "undefined" ? htOption.localAnchorB : oJoint.localAnchorB; 
            oJoint.lowerAngle = typeof htOption.lowerAngle !== "undefined" ? htOption.lowerAngle : oJoint.lowerAngle; 
            oJoint.maxMotorTorque = typeof htOption.maxMotorTorque !== "undefined" ? htOption.maxMotorTorque : oJoint.maxMotorTorque; 
            oJoint.motorSpeed = typeof htOption.motorSpeed !== "undefined" ? htOption.motorSpeed : oJoint.motorSpeed; 
            oJoint.referenceAngle = typeof htOption.referenceAngle !== "undefined" ? htOption.referenceAngle : oJoint.referenceAngle; 
            oJoint.upperAngle = typeof htOption.upperAngle !== "undefined" ? htOption.upperAngle : oJoint.upperAngle;
            return this._oWorld.CreateJoint(oJoint);
        },
        
        /**
         * DistanceJoint를 만든다
         * 
         * @param {Box2D.Dynamics.b2Body} oBody1 연결할 왼쪽 body 
         * @param {Box2D.Dynamics.b2Body} oBody2 연결할 오른쪽 body 
         * @param {Box2D.Common.Math.b2Vec2} oAnchor1 왼쪽 연결점
         * @param {Box2D.Common.Math.b2Vec2} oAnchor2 오른쪽 연결점
         * @param {Object} htOption Joint 옵션
         * @return {Box2D.Dynamics.Joints.b2Joint} 생성된 Joint
         */
        createDistanceJoint : function (oBody1, oBody2, oAnchor1, oAnchor2, htOption) {
            var oJoint = new Box2D.Dynamics.Joints.b2DistanceJointDef();
            htOption = htOption || {};
            oJoint.Initialize(oBody1, oBody2, oAnchor1, oAnchor2);
            oJoint.dampingRatio = typeof htOption.dampingRatio !== "undefined" ? htOption.dampingRatio : oJoint.dampingRatio; 
            oJoint.frequencyHz = typeof htOption.frequencyHz !== "undefined" ? htOption.frequencyHz : oJoint.frequencyHz; 
            oJoint.length = typeof htOption.length !== "undefined" ? htOption.length : oJoint.length; 
            oJoint.localAnchorA = typeof htOption.localAnchorA !== "undefined" ? htOption.localAnchorA : oJoint.localAnchorA; 
            oJoint.localAnchorB = typeof htOption.localAnchorB !== "undefined" ? htOption.localAnchorB : oJoint.localAnchorB; 
            return this._oWorld.CreateJoint(oJoint);
        },
        
        /**
         * FrictionJoint를 만든다
         * 
         * @param {Box2D.Dynamics.b2Body} oBody1 연결할 왼쪽 body 
         * @param {Box2D.Dynamics.b2Body} oBody2 연결할 오른쪽 body 
         * @param {Box2D.Common.Math.b2Vec2} oAnchor 연결점
         * @param {Object} htOption Joint 옵션
         * @return {Box2D.Dynamics.Joints.b2Joint} 생성된 Joint
         */
        createFrictionJoint : function (oBody1, oBody2, oAnchor, htOption) {
            var oJoint = new Box2D.Dynamics.Joints.b2FrictionJointDef();
            htOption = htOption || {};
            oJoint.Initialize(oBody1, oBody2, oAnchor);
            oJoint.localAnchorA = typeof htOption.localAnchorA !== "undefined" ? htOption.localAnchorA : oJoint.localAnchorA; 
            oJoint.localAnchorB = typeof htOption.localAnchorB !== "undefined" ? htOption.localAnchorB : oJoint.localAnchorB; 
            oJoint.maxForce = typeof htOption.maxForce !== "undefined" ? htOption.maxForce : oJoint.maxForce; 
            oJoint.maxTorque = typeof htOption.maxTorque !== "undefined" ? htOption.maxTorque : oJoint.maxTorque; 
            return this._oWorld.CreateJoint(oJoint);
        },
        
        /**
         * GearJoint를 만든다
         * 
         * @param {Box2D.Dynamics.Joints.b2Joint} oJoint1 연결할 joint1
         * @param {Box2D.Dynamics.Joints.b2Joint} oJoint2 연결할 joint2
         * @param {Number} nRatio 기어 비율
         * @return {Box2D.Dynamics.Joints.b2Joint} 생성된 Joint
         */
        createGearJoint : function (oJoint1, oJoint2, nRatio) {
            var oJoint = new Box2D.Dynamics.Joints.b2GearJointDef();
            oJoint.joint1 = oJoint2 
            oJoint.joint2 = oJoint2; 
            oJoint.ratio = nRatio; 
            return this._oWorld.CreateJoint(oJoint);
        },
        
        /**
         * LineJoint를 만든다
         * 
         * @param {Box2D.Dynamics.b2Body} oBody1 연결할 왼쪽 body 
         * @param {Box2D.Dynamics.b2Body} oBody2 연결할 오른쪽 body 
         * @param {Box2D.Common.Math.b2Vec2} oAnchor 연결점
         * @param {Box2D.Common.Math.b2Vec2} oAxis 축
         * @param {Object} htOption Joint 옵션
         * @return {Box2D.Dynamics.Joints.b2Joint} 생성된 Joint
         */
        createLineJoint : function (oBody1, oBody2, oAnchor, oAxis, htOption) {
            var oJoint = new Box2D.Dynamics.Joints.b2LineJointDef();
            htOption = htOption || {};
            oJoint.Initialize(oBody1, oBody2, oAnchor, oAxis);
            oJoint.enableLimit = typeof htOption.enableLimit !== "undefined" ? htOption.enableLimit : oJoint.enableLimit; 
            oJoint.enableMotor = typeof htOption.enableMotor !== "undefined" ? htOption.enableMotor : oJoint.enableMotor; 
            oJoint.localAnchorA = typeof htOption.localAnchorA !== "undefined" ? htOption.localAnchorA : oJoint.localAnchorA; 
            oJoint.localAnchorB = typeof htOption.localAnchorB !== "undefined" ? htOption.localAnchorB : oJoint.localAnchorB; 
            oJoint.localAxisA = typeof htOption.localAxisA !== "undefined" ? htOption.localAxisA : oJoint.localAxisA; 
            oJoint.lowerTranslation = typeof htOption.lowerTranslation !== "undefined" ? htOption.lowerTranslation : oJoint.lowerTranslation; 
            oJoint.maxMotorForce = typeof htOption.maxMotorForce !== "undefined" ? htOption.maxMotorForce : oJoint.maxMotorForce; 
            oJoint.motorSpeed = typeof htOption.motorSpeed !== "undefined" ? htOption.motorSpeed : oJoint.motorSpeed; 
            oJoint.upperTranslation = typeof htOption.upperTranslation !== "undefined" ? htOption.upperTranslation : oJoint.upperTranslation; 
            return this._oWorld.CreateJoint(oJoint);
        },
        
        /**
         * MouseJoint를 만든다
         * 
         * @param {Box2D.Dynamics.b2Body} oBody 연결할 대상 body 
         * @param {Box2D.Common.Math.b2Vec2} oTarget 대상 좌표
         * @param {Object} htOption Joint 옵션
         * @return {Box2D.Dynamics.Joints.b2Joint} 생성된 Joint
         */
        createMouseJoint : function (oBody, oTarget, htOption) {
            var oJoint = new Box2D.Dynamics.Joints.b2MouseJointDef();
            htOption = htOption || {};
            oJoint.bodyA = this._oWorld.GetGroundBody();
            oJoint.bodyB = oBody;
            oJoint.target = oTarget;
            oJoint.dampingRatio = typeof htOption.dampingRatio !== "undefined" ? htOption.dampingRatio : oJoint.dampingRatio; 
            oJoint.frequencyHz = typeof htOption.frequencyHz !== "undefined" ? htOption.frequencyHz : oJoint.frequencyHz; 
            oJoint.maxForce = typeof htOption.maxForce !== "undefined" ? htOption.maxForce : oJoint.maxForce;
            return this._oWorld.CreateJoint(oJoint);
        },
        
        /**
         * PrismaticJoint를 만든다
         * 
         * @param {Box2D.Dynamics.b2Body} oBody1 연결할 왼쪽 body 
         * @param {Box2D.Dynamics.b2Body} oBody2 연결할 오른쪽 body 
         * @param {Box2D.Common.Math.b2Vec2} oAnchor 연결점
         * @param {Box2D.Common.Math.b2Vec2} oAxis 축
         * @param {Object} htOption Joint 옵션
         * @return {Box2D.Dynamics.Joints.b2Joint} 생성된 Joint
         */
        createPrismaticJoint : function (oBody1, oBody2, oAnchor, oAxis, htOption) {
            var oJoint = new Box2D.Dynamics.Joints.b2PrismaticJointDef();
            htOption = htOption || {};
            oJoint.Initialize(oBody1, oBody2, oAnchor, oAxis);
            oJoint.enableLimit = typeof htOption.enableLimit !== "undefined" ? htOption.enableLimit : oJoint.enableLimit; 
            oJoint.enableMotor = typeof htOption.enableMotor !== "undefined" ? htOption.enableMotor : oJoint.enableMotor; 
            oJoint.localAnchorA = typeof htOption.localAnchorA !== "undefined" ? htOption.localAnchorA : oJoint.localAnchorA; 
            oJoint.localAnchorB = typeof htOption.localAnchorB !== "undefined" ? htOption.localAnchorB : oJoint.localAnchorB; 
            oJoint.localAxisA = typeof htOption.localAxisA !== "undefined" ? htOption.localAxisA : oJoint.localAxisA; 
            oJoint.lowerTranslation = typeof htOption.lowerTranslation !== "undefined" ? htOption.lowerTranslation : oJoint.lowerTranslation; 
            oJoint.maxMotorForce = typeof htOption.maxMotorForce !== "undefined" ? htOption.maxMotorForce : oJoint.maxMotorForce; 
            oJoint.motorSpeed = typeof htOption.motorSpeed !== "undefined" ? htOption.motorSpeed : oJoint.motorSpeed; 
            oJoint.referenceAngle = typeof htOption.referenceAngle !== "undefined" ? htOption.referenceAngle : oJoint.referenceAngle; 
            oJoint.upperTranslation = typeof htOption.upperTranslation !== "undefined" ? htOption.upperTranslation : oJoint.upperTranslation; 
            return this._oWorld.CreateJoint(oJoint);
        },
        
        /**
         * PulleyJoint를 만든다
         * 
         * @param {Box2D.Dynamics.b2Body} oBody1 연결할 왼쪽 body 
         * @param {Box2D.Dynamics.b2Body} oBody2 연결할 오른쪽 body 
         * @param {Box2D.Common.Math.b2Vec2} oGroundAnchor1 첫번째 땅 연결점
         * @param {Box2D.Common.Math.b2Vec2} oGroundAnchor2 두번째 땅 연결점
         * @param {Box2D.Common.Math.b2Vec2} oAnchor1 왼쪽 연결점
         * @param {Box2D.Common.Math.b2Vec2} oAnchor2 오른쪽 연결점
         * @param {Number} nRatio The pulley ratio, used to simulate a block-and-tackle.
         * @param {Object} htOption Joint 옵션
         * @return {Box2D.Dynamics.Joints.b2Joint} 생성된 Joint
         */
        createPulleyJoint : function (oBody1, oBody2, oGaA, oGaB, oAnchor1, oAnchor2, nR, htOption) {
            var oJoint = new Box2D.Dynamics.Joints.b2PulleyJointDef();
            htOption = htOption || {};
            oJoint.Initialize(oBody1, oBody2, oGaA, oGaB, oAnchor1, oAnchor2, nR);
            oJoint.lengthA = typeof htOption.lengthA !== "undefined" ? htOption.lengthA : oJoint.lengthA; 
            oJoint.lengthB = typeof htOption.lengthB !== "undefined" ? htOption.lengthB : oJoint.lengthB;
            oJoint.localAnchorA = typeof htOption.localAnchorA !== "undefined" ? htOption.localAnchorA : oJoint.localAnchorA; 
            oJoint.localAnchorB = typeof htOption.localAnchorB !== "undefined" ? htOption.localAnchorB : oJoint.localAnchorB; 
            oJoint.maxLengthA = typeof htOption.maxLengthA !== "undefined" ? htOption.maxLengthA : oJoint.maxLengthA; 
            oJoint.maxLengthB = typeof htOption.maxLengthB !== "undefined" ? htOption.maxLengthB : oJoint.maxLengthB; 
            return this._oWorld.CreateJoint(oJoint);
        },
        
        /**
         * WeldJoint를 만든다
         * 
         * @param {Box2D.Dynamics.b2Body} oBody1 연결할 왼쪽 body 
         * @param {Box2D.Dynamics.b2Body} oBody2 연결할 오른쪽 body 
         * @param {Box2D.Common.Math.b2Vec2} oAnchor 연결점
         * @param {Object} htOption Joint 옵션
         * @return {Box2D.Dynamics.Joints.b2Joint} 생성된 Joint
         */
        createWeldJoint : function (oBody1, oBody2, oAnchor, htOption) {
            var oJoint = new Box2D.Dynamics.Joints.b2WeldJointDef();
            htOption = htOption || {};
            oJoint.Initialize(oBody1, oBody2, oAnchor);
            oJoint.localAnchorA = typeof htOption.localAnchorA !== "undefined" ? htOption.localAnchorA : oJoint.localAnchorA; 
            oJoint.localAnchorB = typeof htOption.localAnchorB !== "undefined" ? htOption.localAnchorB : oJoint.localAnchorB; 
            oJoint.referenceAngle = typeof htOption.referenceAngle !== "undefined" ? htOption.referenceAngle : oJoint.referenceAngle; 
            return this._oWorld.CreateJoint(oJoint);
        },      
        
        /**
         * 등록된 Joint를 지운다
         * 
         * @param {Box2D.Dynamics.Joints.b2Joint} oJoint
         */
        removeJoint : function (oJoint) {
            this._oWorld.DestroyJoint(oJoint);
        },
        
        /**
         * b2World를 생성한다
         * 
         * @param {Number} nGravity 중력
         * @return {Box2D.Dynamics.b2World}
         */
        createWorld : function (nGravity) {
            return new b2World(new b2Vec2(0, nGravity), true);
        },
        
        /**
         * 생성된 World 객체를 반환한다
         * 
         * @return {Box2D.Dynamics.b2World}
         */
        getWorld : function () {
            return this._oWorld;
        },
        
        /**
         * Box2d를 로드한다.
         * 
         * @param {Boolean} bIsDebug 디버깅용 레이어를 표시할지 여부
         */
        load : function (bIsDebug) {
            if (!this._bIsLoaded) {
                this._bIsLoaded = true;
                this._nStep = Math.round(1000 / collie.Renderer.getDuration());
                
                if (bIsDebug) {
                    this._setDebug(this._nWidth, this._nHeight);
                }
                
                collie.Renderer.attach("process", this._fOnProcess);
            }
        },
        
        /**
         * Box2d를 해제하여 사용하지 않는다
         */
        unload : function () {
            if (this._bIsLoaded) {
                this._bIsLoaded = false;
                collie.Renderer.detach("process", this._fOnProcess);
                this._unsetDebug();
            }
        },
        
        /**
         * 스테이지 크기가 바뀔 경우
         * 
         * @param {Number} nWidth
         * @param {Number} nHeight
         */
        resize : function (nWidth, nHeight) {
            var x, y, width, height;
            this._nWidth = nWidth;
            this._nHeight = nHeight;
            
            if (this._htWall) {
                for (var i in this._htWall) {
                    switch (i) {
                        case "left" :
                            x = -this.WIDTH_OF_WALL + (this.WIDTH_OF_WALL / 2);
                            y = -this.WIDTH_OF_WALL + ((this._nHeight + this.WIDTH_OF_WALL * 2) / 2);
                            width = this.WIDTH_OF_WALL;
                            height = this._nHeight + this.WIDTH_OF_WALL * 2;
                            break;
                            
                        case "right" :
                            x = this._nWidth + (this.WIDTH_OF_WALL / 2);
                            y = -this.WIDTH_OF_WALL + ((this._nHeight + this.WIDTH_OF_WALL * 2) / 2);
                            width = this.WIDTH_OF_WALL;
                            height = this._nHeight + this.WIDTH_OF_WALL * 2;
                            break;
                            
                        case "top" :
                            x = -this.WIDTH_OF_WALL + ((this._nWidth + this.WIDTH_OF_WALL * 2) / 2);
                            y = -this.WIDTH_OF_WALL + (this.WIDTH_OF_WALL / 2);
                            width = this._nWidth + this.WIDTH_OF_WALL * 2;
                            height = this.WIDTH_OF_WALL;
                            break;
                            
                        case "bottom" :
                            x = -this.WIDTH_OF_WALL + ((this._nWidth + this.WIDTH_OF_WALL * 2) / 2);
                            y = this._nHeight + (this.WIDTH_OF_WALL / 2);
                            width = this._nWidth + this.WIDTH_OF_WALL * 2;
                            height = this.WIDTH_OF_WALL;
                            break;
                    }
                    
                    x /= collie.Box2d.SCALE;
                    y /= collie.Box2d.SCALE;
                    width /= collie.Box2d.SCALE;
                    height /= collie.Box2d.SCALE;
                    this._htWall[i].SetPosition(collie.Box2d.vec2(x, y));
                    this._htWall[i].GetFixtureList().GetShape().SetAsBox(width / 2, height / 2);
                }
            }
        },
        
        /**
         * 디버깅 모드를 설정한다. 설정 후에는 화면에 Box2d 객체가 표시 된다
         * @private
         */
        _setDebug : function (nWidth, nHeight) {
            if (!this._bIsDebug) {
                if (this._oDebugLayer === null) {
                    this._oDebugLayer = new collie.Layer({
                        width: nWidth,
                        height: nHeight
                    });
                } else {
                    this._oDebugLayer.resize(nWidth, nHeight);
                }
                
                collie.Renderer.addLayer(this._oDebugLayer);
                
                if (this._oDebugDraw === null) {
                    this._oDebugDraw = new b2DebugDraw();
                    this._oDebugDraw.SetSprite(this._oDebugLayer.getContext());
                    this._oDebugDraw.SetDrawScale(30.0);
                    this._oDebugDraw.SetFillAlpha(0.3);
                    this._oDebugDraw.SetLineThickness(1.0);
                    this._oDebugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
                    this._oWorld.SetDebugDraw(this._oDebugDraw);
                }
                
                this._bIsDebug = true;
            }
        },
        
        /**
         * 디버깅 모드를 해제한다
         * @private
         */
        _unsetDebug : function () {
            if (this._bIsDebug) {
                collie.Renderer.removeLayer(this._oDebugLayer);
                this._bIsDebug = false;
            }
        },
        
        _onProcess : function (e) {
            var nStepRate = 1 / this._nStep;
            this._oWorld.Step(nStepRate, this.ITERATIONS_VELOCITY, this.ITERATIONS_POSITION);
            this._oWorld.ClearForces();
            var body = this._oWorld.GetBodyList();
            
            // 등록된 객체가 있을 경우 업데이트
            if (body) {
                do {
                    // 업데이트할 수 있는 객체면
                    if (body.IsActive() && body._displayObjectId) {
                        this._update(body);
                    }
                    
                    body = body.GetNext();
                } while (body);
            }
            
            // 디버깅 용 box2d 객체 그림
            if (this._bIsDebug) {
                this._oWorld.DrawDebugData();
            }
        },
        
        /**
         * 객체의 상태를 업데이트
         *
         * @param {Box2D.Dynamics.b2Body} oBody 
         */
        _update : function (oBody) {
            var oDisplayObject = collie.util.getDisplayObjectById(oBody._displayObjectId);
            
            if (oDisplayObject) {
                var htInfo = oDisplayObject.get();
                var htPosition = oBody.GetPosition();
                oDisplayObject.set("angle", collie.util.toDeg(oBody.GetAngle()));
                oDisplayObject.set("x", (htPosition.x - ((htInfo.width / collie.Box2d.SCALE) / 2)) * collie.Box2d.SCALE);
                oDisplayObject.set("y", (htPosition.y - ((htInfo.height / collie.Box2d.SCALE) / 2)) * collie.Box2d.SCALE);
            } else {
                // displayObject가 사라졌다면 box2d 객체도 지움
                this._oWorld.DestroyBody(oBody);
            }
        }
    });
    
    /**
     * b2Vec2를 생성해서 반환, 주로 속도에서 쓰임
     *
     * @static 
     * @param {Number} x
     * @param {Number} y
     * @param {Boolean} bIsPixel
     * @return {Box2D.Common.Math.b2Vec2}
     */
    collie.Box2d.vec2 = function (x, y, bIsPixel) {
        if (bIsPixel) {
            x /= collie.Box2d.SCALE;
            y /= collie.Box2d.SCALE;
        }
        
        return new b2Vec2(x, y);
    };
    
    /**
     * UserData 설정돼 있는지 여부를 반환
     *
     * @static 
     * @param {Box2D.Dynamics.b2Body} oBody 대상 Body 
     * @return {Boolean} UserData가 있으면 true를 반환 
     */
    collie.Box2d.hasUserData = function (oBody) {
        var userData = oBody.GetUserData();
        return (typeof userData !== "undefined") && userData !== null; 
    };
    
    /**
     * @static
     * @property {Number} pixel을 meter로 바꿈;
     */
    collie.Box2d.SCALE = 30;
    
    /**
     * @static
     * @property {Object} Body type
     */
    collie.Box2d.BODY_TYPE = {
        STATIC : "static",
        KINEMATIC : "kinematic",
        DYNAMIC : "dynamic"
    };
})();
;
/**
 * 비트맵으로 구성된 숫자를 사용하기 위한 클래스
 * 0과 양수만 표현할 수 있다.
 * number에서 쓰이는 이미지는 0부터 9까지 가로로 나열된 스프라이트 이미지여야한다
 * @class collie.ImageNumber
 * @extends collie.DisplayObject
 * @param {Object} [htOption] 설정
 * @param {String} [htOption.textAlign="left"] 숫자 정렬 방법, left, right, center를 설정할 수 있다.
 * @param {Number} [htOption.letterSpacing=0] 숫자 간격 음수를 사용하면 간격이 줄어든다 단위는 px
 * @param {Number} [htOption.minDigit=0] 최소 자릿수 지정, 빈 자리는 0으로 채워진다. 0이면 사용안함 
 * @requires collie.addon.js
 * @example
 * var number = new collie.ImageNumber({
 *  textAlign: "center",
 *  letterSpacing: -5,
 *  width: 300,
 *  height: 100
 * }).number({
 *  width: 90,
 *  height: 100,
 *  backgroundImage: "number" // This Image should be contained numbers from 0 to 9.  
 * }).comma({
 *  width: 45, // comma method requires a width option
 *  height: 100,
 *  backgroundImage: "comma"
 * });
 * 
 * number.setValue(999000); // 'number' object would be shown by "999,000"
 * number.comma(false); // It would be shown by "999000"
 */
collie.ImageNumber = collie.Class(/** @lends collie.ImageNumber.prototype */{
    /**
     * @constructs
     */
    $init : function (htOption) {
        this._aNumber = [];
        this._aComma = [];
        this._nIndexNumber = null;
        this._nIndexComma = null;
        this._nValue = null;
        this.option({
            textAlign : "left",
            letterSpacing : 0,
            minDigit : 0
        }, null, true);
    },
    
    /**
     * 값을 설정
     * 
     * @param {Number} nNumber
     * @return {collie.ImageNumber}
     */
    setValue : function (nNumber) {
        this._nValue = Math.max(0, parseInt(nNumber, 10));
        this._nIndexNumber = null;
        this._nIndexComma = null;
        var sNumber = this._nValue.toString();
        var len = sNumber.length;
        
        if (this._htOption.minDigit && len < this._htOption.minDigit) {
            sNumber = (new Array(this._htOption.minDigit - len + 1).join("0")) + sNumber;
            len = this._htOption.minDigit;
        }
        
        var nWidth = this._getWidth(sNumber);
        var nStartLeft = this._getStartPosition(nWidth);
        var nLeft = nStartLeft + nWidth;
        var nCountNumber = 0;
        var bLastCharacter = false;
        
        for (var i = len - 1; i >= 0; i--) {
            // 세 자리 콤마 붙여야 할 때
            if (this._htOptionComma && nCountNumber % 3 === 0 && nCountNumber !== 0) {
                nLeft = nLeft - (this._htOptionComma.width + this._htOption.letterSpacing);
                this._getComma().set({
                    x : nLeft,
                    visible : true
                });
            }
            
            bLastCharacter = (nCountNumber === 0 && this._htOption.textAlign === "right") || (nCountNumber === len && this._htOption.textAlign === "left");
            nLeft = nLeft - (this._htOptionNumber.width + this._htOption.letterSpacing * (bLastCharacter ? 0 : 1));
            this._getNumber().set({
                x : nLeft,
                spriteX : parseInt(sNumber.charAt(i), 10),
                visible : true
            });
            
            nCountNumber++;
        }
        
        this._hideUnusedObject();
    },
    
    /**
     * 설정된 값을 반환한다.
     * @return {Number}
     */
    getValue : function () {
        return this._nValue;
    },
    
    /**
     * 숫자를 만들 때 사용할 옵션을 설정한다
     * 
     * @param {Object} htOption
     * @see {collie.DisplayObject}
     * @return {collie.ImageNumber}
     */
    number : function (htOption) {
        this._htOptionNumber = htOption;
        return this;
    },
    
    /**
     * 세 자리 콤마를 사용할 경우 콤마를 생성할 때 사용할 옵션을 설정한다
     * 
     * @param {Object|Boolean} htOption 콤마를 만들 때 사용할 옵션, 반드시 width를 입력해야 한다, false를 입력하면 콤마를 제거한다
     * @see {collie.DisplayObject}
     * @return {collie.ImageNumber}
     */
    comma : function (htOption) {
        if (!htOption) {
            this._htOptionComma = null;
        } else {
            if (!("width" in htOption)) {
                throw new Error("comma method in ImageNumber requires a width property in options.");
            }
            
            this._htOptionComma = htOption;
        }
        
        if (this._nValue !== null) {
            this.setValue(this._nValue);
        }
        
        return this;
    },
    
    /**
     * 현재 숫자의 표시될 너비를 구한다
     * 
     * @private
     * @return {Number}
     */
    _getWidth : function (nValue) {
        var sValue = nValue.toString();
        var nWidth = sValue.length * (this._htOptionNumber.width + this._htOption.letterSpacing);
        
        if (this._htOptionComma) {
            nWidth += Math.max(0, Math.ceil(sValue.length / 3 - 1)) * (this._htOptionComma.width + this._htOption.letterSpacing);
        }
        
        return nWidth;
    },
    
    /**
     * 현재 숫자가 정렬에 따라 제일 처음에 표기될 위치를 반환한다.
     * @private
     * @return {Number}
     */
    _getStartPosition : function (nWidth) {
        switch (this._htOption.textAlign) {
            case "right" :
                return this._htOption.width - nWidth;
                break;
                
            case "center" :
                return this._htOption.width / 2 - nWidth / 2;
                break;
                
            case "left" :
            default :
                return 0;
        }
    },
    
    /**
     * Pool에서 빈 숫자 객체를 가져온다. 사용하지 않은 객체가 없으면 새로 생성한다
     * 
     * @private
     * @return {collie.DisplayObject}
     */
    _getNumber : function () {
        var startIdx = this._nIndexNumber === null ? 0 : this._nIndexNumber + 1;
        
        // 새로 생성
        if (this._aNumber.length < startIdx + 1) {
             this._aNumber.push(new collie.DisplayObject(this._htOptionNumber).addTo(this));
        }
        
        this._nIndexNumber = startIdx;
        return this._aNumber[startIdx];
    },
    
    /**
     * Pool에서 빈 콤마 객체를 가져온다. 사용하지 않은 객체가 없으면 새로 생성한다
     * 
     * @private
     * @return {collie.DisplayObject}
     */
    _getComma : function () {
        var startIdx = this._nIndexComma === null ? 0 : this._nIndexComma + 1;
        
        // 새로 생성
        if (this._aComma.length < startIdx + 1) {
             this._aComma.push(new collie.DisplayObject(this._htOptionComma).addTo(this));
        }
        
        this._nIndexComma = startIdx;
        return this._aComma[startIdx];
    },
    
    /**
     * 사용하지 않은 객체는 visible을 false로 설정한다
     * @private
     */
    _hideUnusedObject : function () {
        // 콤마는 생성 안됐을 경우에도 전부 없앰
        for (var i = this._nIndexComma !== null ? this._nIndexComma + 1 : 0, l = this._aComma.length; i < l; i++) {
            this._aComma[i].set("visible", false);
        }
        
        // 숫자는 없을 경우가 없으므로 전부 없애지 않음 (최소 0)
        if (this._nIndexNumber !== null) {
            for (var i = this._nIndexNumber + 1, l = this._aNumber.length; i < l; i++) {
                this._aNumber[i].set("visible", false);
            }
        }
    },

    /**
     * 클래스 정보를 문자열로 반환
     * Returns to information of Class as string
     * 
     * @return {String}
     */
    toString : function () {
        return "ImageNumber" + (this.get("name") ? " " + this.get("name") : "")+ " #" + this.getId() + (this.getImage() ? "(image:" + this.getImage().src + ")" : "");
    }
}, collie.DisplayObject);
;
/**
 * A Simple Object Pool
 * 
 * @class
 * @param {Number} nSize Pool Size
 * @param {Object} htOption Default options to make displayObjects
 * @param {Function} [fClass=collie.DisplayObject] The Pool contains objects created by this class
 * @requires collie.addon.js
 * @example
 * var pool = new collie.Pool(10, {
 *  backgroundImage : "test"
 * }); 
 * 
 * // Uses 5 objects
 * var a = pool.get().addTo(layer);
 * var b = pool.get().addTo(layer);
 * var c = pool.get().addTo(layer);
 * var d = pool.get().addTo(layer);
 * var e = pool.get().addTo(layer);
 * 
 * // Releases 5 objects
 * pool.release(a);
 * pool.release(b);
 * pool.release(c);
 * pool.release(d);
 * pool.release(e);
 *
 * // change pool size after initialize a pool class.
 * pool.changeSize(20);
 * @example
 * You can also make the pool contains other classes.
 * <code>
 * var circlePool = new collie.Pool(10, {
 *  radius : 10
 * }, collie.Circle);
 * </code>
 */
collie.Pool = collie.Class(/** @lends collie.Pool.prototype */{
    /**
     * @constructs
     */
    $init : function (nSize, htOption, fClass) {
        this._nSize = nSize || 0;
        this._htDefaultOption = htOption;
        this._aPool = [];
        this._fClass = fClass || collie.DisplayObject;
        this._nLengthActiveObject = 0;
        this._allocate();
    },
    
    /**
     * @private
     */
    _allocate : function () {
        var currentSize = this._nLengthActiveObject + this._aPool.length;
        
        if (this._nSize && currentSize < this._nSize) {
            for (var i = currentSize; i < this._nSize; i++) {
                this._aPool.push(new this._fClass(this._htDefaultOption));
            }
        }
    },
    
    /**
     * Change a size of the pool.
     * @param {Number} nSize
     */
    changeSize : function (nSize) {
        this._nSize = nSize;
        this._allocate();
    },
    
    /**
     * @return {Number}
     */
    getSize : function () {
        return this._nSize;
    },
    
    /**
     * Change a default options to make displayObjects
     * @param {Object} htOption
     */
    changeOption : function (htOption) {
        this._htDefaultOption = htOption;
    },
    
    /**
     * Get an object in pool
     */
    get : function () {
        if (!this._aPool.length) {
            throw new Error("The Pool is empty");
        }
        
        var oTarget = this._aPool.pop();
        this._nLengthActiveObject++;
        return oTarget;
    },
    
    /**
     * Release an object
     * 
     * @param {collie.DisplayObject} oTarget
     */
    release : function (oTarget) {
        oTarget.leave();
        this._nLengthActiveObject--;
        this._aPool.push(oTarget);
    }
});
;
/**
 * A Simple 1:N Collision Detection
 * 
 * @class
 * @extends collie.Component
 * @param {Object} htOption
 * @param {Number} [htOption.frequency=3] Check Frequency, 1이면 매 프레임 마다, 10이면 10프레임 마다 한 번씩 체크한다 
 * @param {Number} [htOption.cacheSize=80] 캐시 타일 크기 단위는 px 
 * @param {Boolean} [htOption.useDebug=false] 충돌체크 영역을 화면에 표시
 * @param {String} [htOption.debugColor=yellow] 충돌체크 영역의 색, useDebug를 활성화할 때 사용한다
 * @param {String} [htOption.debugListenerColor=yellow] 리스너의 충돌체크 영역의 색, useDebug를 활성화할 때 사용한다
 * @param {Number} [htOption.debugOpacity=0.5] 충돌체크 영역의 투명도, useDebug를 활성화할 때 사용한다
 * @requires collie.addon.js
 * @example
 * var sensor = new collie.Sensor({
 *  frequency : 10
 * });
 * 
 * // Add target objects
 * sensor.add(oDisplayObjectTarget, "anyText");
 * sensor.add(oDisplayObjectTarget, "anyText");
 * sensor.add(oDisplayObjectTarget, "anyText");
 * sensor.add(oDisplayObjectTarget, "otherText");
 * sensor.add(oDisplayObjectTarget, "otherText");
 * sensor.add(oDisplayObjectTarget, "otherText");
 * 
 * // Add target object that has a circle shape
 * sensor.add(oDisplayObjectTarget, "otherText", 15); // radius
 * 
 * // Add target object that has a margin of width and a margin of height
 * sensor.add(oDisplayObjectTarget, "otherText", 10, 20); // a margin of width, a margin of height
 * 
 * // Add a listener object for detecting target objects set a category as "anyCategory"
 * sensor.addListener(oDisplayObjectListener, "anyText", function (a, b) {
 *  // begin collision
 * }, function (a, b) {
 *  // end collision
 * });
 * 
 * // Add a listener object that has a circle shape
 * sensor.addListener(oDisplayObjectListener, "anyText", function (a, b) {
 *  // begin collision
 * }, function (a, b) {
 *  // end collision
 * }, 15); // radius
 * 
 * // start sensing
 * sensor.start();
 * 
 * // stop sensing
 * sensor.stop();
 */
collie.Sensor = collie.Class(/** @lends collie.Sensor.prototype */{
    /**
     * If you want to make sensitive higher a case of pass through like a bullet, you should decrease this value. (px) It will affect the performance
     * @type {Number}
     */
    RAY_SENSING_DISTANCE : 10, // px
    
    /**
     * @constructs
     */
    $init : function (htOption) {
        this.option({
            frequency : 3,
            cacheSize : 80,
            useDebug : false,
            debugListenerColor : "red",
            debugColor : "yellow",
            debugOpacity : 0.5
        });
        
        if (typeof htOption !== "undefined") {
            this.option(htOption);
        }
        
        this._nCurrentFrame = null;
        this._nAccumulateFrame = 0; 
        this._aListeners = [];
        this._htListenerCollision = {};
        this._htObject = {};
        this._htCacheMap = {};
        this._htCustomAreaCircle = {};
        this._htCustomAreaBox = {};
        this._fUpdate = this._onProcess.bind(this);
    },
    
    /**
     * 충돌 체크를 일괄적으로 진행
     * 
     * @private
     * @param {Number} nFrame 진행된 프레임 수
     */
    update : function (nFrame) {
        if (this._nCurrentFrame === null || this._nCurrentFrame > nFrame) {
            this._nCurrentFrame = nFrame;
        }
        
        this._nAccumulateFrame += (nFrame - this._nCurrentFrame);
        this._nCurrentFrame = nFrame;
        
        // 빈도 수가 채워지면 그 때 확인 함
        if (this._nAccumulateFrame >= this._htOption.frequency) {
            this._nAccumulateFrame = 0;
            this._makeCacheMap();
            this._htListenerCollisionBefore = this._htListenerCollision;
            this._htListenerCollision = {};
            
            for (var i = 0, l = this._aListeners.length; i < l; i++) {
                var listener = this._aListeners[i];
                var htBoundary = this._getBoundary(listener.displayObject);
                this._makeCustomArea(listener.displayObject, htBoundary);
                this.detect(listener.displayObject, listener.category, htBoundary, listener.beginCallback, listener.endCallback);
            }
        }
    },
    
    _getBoundary : function (oDisplayObject) {
        var nBeforeLeft = null;
        var nBeforeRight = null;
        var nBeforeTop = null;
        var nBeforeBottom = null;
        var points;
        
        // 이전 움직임이 있다면 저장
        if (oDisplayObject._htBoundary !== null) {
            nBeforeLeft = oDisplayObject._htBoundary.left;
            nBeforeTop = oDisplayObject._htBoundary.top;
            nBeforeBottom = oDisplayObject._htBoundary.bottom;
            nBeforeRight = oDisplayObject._htBoundary.right;
            points = oDisplayObject._htBoundary.points;
        }
        
        var htBoundary = oDisplayObject.getBoundary(true, true);
        
        // 의미 있게 움직였다면 영역 확장 함
        if (nBeforeLeft !== null && (
            Math.abs(nBeforeLeft - htBoundary.left) >= this.RAY_SENSING_DISTANCE ||
            Math.abs(nBeforeTop - htBoundary.top) >= this.RAY_SENSING_DISTANCE
        )) {
            points.push(htBoundary.points[0]);
            points.push(htBoundary.points[1]);
            points.push(htBoundary.points[2]);
            points.push(htBoundary.points[3]);
            
            htBoundary.expanded = {
                left : Math.min(nBeforeLeft, htBoundary.left),  
                right : Math.max(nBeforeRight, htBoundary.right),
                top : Math.min(nBeforeTop, htBoundary.top),
                bottom : Math.max(nBeforeBottom, htBoundary.bottom),
                points : points,
                isExpanded : true
            };
        } else {
            htBoundary.expanded = htBoundary;
            htBoundary.expanded.isExpanded = false; 
        }
                
        return htBoundary;
    },
    
    /**
     * @param {collie.DisplayObject} oDisplayObject
     * @param {Object} htBoundary
     * @private
     */
    _makeCustomArea : function (oDisplayObject, htBoundary) {
        var nId = oDisplayObject.getId();
        
        if (this._htCustomAreaBox[nId] || this._htCustomAreaCircle[nId]) {
            htBoundary.isTransform = true;
            htBoundary.centerX = htBoundary.points[0][0] + (htBoundary.points[2][0] - htBoundary.points[0][0]) / 2;
            htBoundary.centerY = htBoundary.points[0][1] + (htBoundary.points[2][1] - htBoundary.points[0][1]) / 2;
            
            // 상자면 미리 구해 놓기
            if (this._htCustomAreaBox[nId]) {
                var minX = Number.MAX_VALUE;
                var minY = Number.MAX_VALUE;
                var maxX = -Number.MAX_VALUE;
                var maxY = -Number.MAX_VALUE;
                 
                for (var i = 0, l = htBoundary.points.length; i < l; i++) {
                    var point = htBoundary.points[i];
                    var theta = Math.atan2(htBoundary.centerY - point[1], htBoundary.centerX - point[0]);
                    point[0] += this._htCustomAreaBox[nId] * Math.cos(theta);
                    point[1] += this._htCustomAreaBox[nId] * Math.sin(theta);
                    
                    minX = Math.min(minX, point[0]);
                    maxX = Math.max(maxX, point[0]);
                    minY = Math.min(minY, point[1]);
                    maxY = Math.max(maxY, point[1]);
                }
                
                htBoundary.left = minX;
                htBoundary.right = maxX;
                htBoundary.top = minY;
                htBoundary.bottom = maxY;
            }
        }
    },
    
    /**
     * @private
     */
    _makeCacheMap : function () {
        var displayObject;
        var startX;
        var startY;
        var endX;
        var endY;
        
        for (var key in this._htObject) {
            this._htCacheMap[key] = {};
            
            for (var i = 0, l = this._htObject[key].length; i < l; i++) {
                displayObject = this._htObject[key][i];
                var htBoundary = this._getBoundary(displayObject);
                startX = Math.floor(htBoundary.expanded.left / this._htOption.cacheSize);
                endX = Math.floor(htBoundary.expanded.right / this._htOption.cacheSize);
                startY = Math.floor(htBoundary.expanded.top / this._htOption.cacheSize);
                endY = Math.floor(htBoundary.expanded.bottom / this._htOption.cacheSize);
                this._makeCustomArea(displayObject, htBoundary);
                
                // 타일에 객체 담아 둠
                for (var row = startY; row <= endY; row++) {
                    this._htCacheMap[key][row] = this._htCacheMap[key][row] || {};
                    
                    for (var col = startX; col <= endX; col++) {
                        this._htCacheMap[key][row][col] = this._htCacheMap[key][row][col] || [];
                        this._htCacheMap[key][row][col].push(displayObject);
                    }
                }
            }
        }
    },
    
    /**
     * 충돌 갑지 체크
     * 
     * @param {collie.DisplayObject} oDisplayObject 등록된 객체들과 충돌 감지할 객체
     * @param {String} sCategory 여러 개의 카테고리 입력 가능, 구분은 콤마(,)
     * @param {Object} htBoundaryListener Listener의 Boundary는 미리 구해 놓는다
     * @param {Function} fBeginCallback 충돌이 일어났을 때 실행될 함수
     * @param {Function} fEndCallback 충돌이 끝났을 때 실행될 함수
     */
    detect : function (oDisplayObject, sCategory, htBoundaryListener, fBeginCallback, fEndCallback) {
        if (sCategory.indexOf(",") !== -1) {
            var aCategories = sCategory.split(",");
            
            for (var i = 0, l = aCategories.length; i < l; i++) {
                this.detect(oDisplayObject, aCategories[i], htBoundaryListener, fBeginCallback, fEndCallback);
            }
        } else {
            var startX = Math.floor(htBoundaryListener.expanded.left / this._htOption.cacheSize);
            var endX = Math.floor(htBoundaryListener.expanded.right / this._htOption.cacheSize);
            var startY = Math.floor(htBoundaryListener.expanded.top / this._htOption.cacheSize);
            var endY = Math.floor(htBoundaryListener.expanded.bottom / this._htOption.cacheSize);
            var idA = oDisplayObject.getId();
            
            if (this._htCacheMap[sCategory]) {
                for (var row = startY; row <= endY; row++) {
                    for (var col = startX; col <= endX; col++) {
                        if (this._htCacheMap[sCategory][row] && this._htCacheMap[sCategory][row][col]) {
                            for (var i = 0, l = this._htCacheMap[sCategory][row][col].length; i < l; i++) {
                                var target = this._htCacheMap[sCategory][row][col][i];
                                var idB = target.getId();
                                
                                // 이미 충돌 했다면 지나감
                                if (this._htListenerCollision[idA] && this._htListenerCollision[idA][idB]) {
                                    continue;
                                }
                                
                                var bIsHit = this._hitTest(oDisplayObject, target, htBoundaryListener, target._htBoundary);
                                var bIsInCollision = (this._htListenerCollisionBefore[idA] && this._htListenerCollisionBefore[idA][idB]);
                                
                                // 만났을 떄
                                if (bIsHit) {
                                    this._htListenerCollision[idA] = this._htListenerCollision[idA] || {};
                                    this._htListenerCollision[idA][idB] = true;
                                    
                                    if (!bIsInCollision) {
                                        fBeginCallback(oDisplayObject, target);
                                    }
                                }
                            }
                        }
                    }
                }
                
                // 충돌이 일어난 것중에 다시 만나지 않은 것이 있다면 end 호출
                for (var idB in this._htListenerCollisionBefore[idA]) {
                    if (!this._htListenerCollision[idA] || !this._htListenerCollision[idA][idB]) {
                        fEndCallback(oDisplayObject, collie.util.getDisplayObjectById(idB));
                    }
                }
            }
        }
    },
    
    /**
     * 충돌 테스트
     * @private
     * @param {collie.DisplayObject} oA
     * @param {collie.DisplayObject} oB
     * @param {Object} htA collie.DisplayObject#getBoundary
     * @param {Object} htB collie.DisplayObject#getBoundary
     * @return {Boolean} 겹치면 true
     */
    _hitTest : function (oA, oB, htA, htB) {
        var idA = oA.getId();
        var idB = oB.getId();
        
        // 둘 중에 하나라도 벗어나는게 있다면 겹치는게 아님
        if (
            (htA.expanded.left > htB.expanded.right || htB.expanded.left > htA.expanded.right) || 
            (htA.expanded.top > htB.expanded.bottom || htB.expanded.top > htA.expanded.bottom)
            ) {
            return false;
        } else if (htA.isTransform || htB.isTransform || htA.expanded.isExpanded || htB.expanded.isExpanded) {
            // 빠르게 움직일 땐 사각형 모델을 적용함
            if (htA.expanded.isExpanded || htB.expanded.isExpanded || (!this._htCustomAreaCircle[idA] && !this._htCustomAreaCircle[idB])) {
                if (
                    (
                        htA.expanded.left <= htB.expanded.left &&
                        htA.expanded.top <= htB.expanded.top &&
                        htA.expanded.right >= htB.expanded.right &&
                        htA.expanded.bottom >= htB.expanded.bottom
                    ) || (
                        htA.expanded.left > htB.expanded.left &&
                        htA.expanded.top > htB.expanded.top &&
                        htA.expanded.right < htB.expanded.right &&
                        htA.expanded.bottom < htB.expanded.bottom
                    )
                ) {
                    return true;
                }
                
                // 교차하는 선이 있으면 true
                //TODO O(N^2)보다 더 빠른 알고리즘이 있었으면 좋겠음
                for (var i = 0, l = htA.expanded.points.length; i < l; i++) {
                    var a1 = htA.expanded.points[i];
                    var a2 = htA.expanded.points[(i === l - 1) ? 0 : i + 1];
                    
                    for (var j = 0, jl = htB.expanded.points.length; j < jl; j++) {
                        var b1 = htB.expanded.points[j];
                        var b2 = htB.expanded.points[(j === jl - 1) ? 0 : j + 1];
                        
                        if (this._isIntersectLine(a1, a2, b1, b2)) {
                            return true;
                        }
                    }
                }
            } else if (this._htCustomAreaCircle[idA] && this._htCustomAreaCircle[idB]) {
                return collie.util.getDistance(htA.centerX, htA.centerY, htB.centerX, htB.centerY) <= this._htCustomAreaCircle[idA] + this._htCustomAreaCircle[idB];
            } else  {
                var box;
                var circle;
                var radius;
                
                if (this._htCustomAreaCircle[idB]) {
                    box = htA;
                    circle = htB;
                    radius = this._htCustomAreaCircle[idB];
                } else {
                    box = htB;
                    circle = htA;
                    radius = this._htCustomAreaCircle[idA];
                }
                
                for (var i = 0, l = box.points.length; i < l; i++) {
                    var a1 = htA.points[i];
                    var a2 = htA.points[(i === l - 1) ? 0 : i + 1];
                    var theta = Math.atan((circle.centerY - a1[1]) / (circle.centerX - a1[0]));
                    theta -= Math.atan((a2[1] - a1[1]) / (a2[0] - a1[0]));
                    
                    if (Math.sin(theta) * collie.util.getDistance(circle.centerX, circle.centerY, a1[0], a1[1]) <= radius) {
                        return true;
                    }
                }
                
                return false;
            }
            
            // 교차하는 선이 없으면 false
            return false;
        } else {
            return true;
        }
    },
    
    /**
     * @private
     * @param {Array} a1
     * @param {Array} a2
     * @param {Array} b1
     * @param {Array} b2
     * @return {Boolean} 겹치면 true
     */
    _isIntersectLine : function (a1, a2, b1, b2) {
        var denom = (b2[1] - b1[1]) * (a2[0] - a1[0]) - (b2[0] - b1[0]) * (a2[1] - a1[1]);
        
        if (denom === 0) {
            return false;
        }
        
        var _t = (b2[0] - b1[0]) * (a1[1] - b1[1]) - (b2[1] - b1[1]) * (a1[0] - b1[0]);
        var _s = (a2[0] - a1[0]) * (a1[1] - b1[1]) - (a2[1] - a1[1]) * (a1[0] - b1[0]);
        var t = _t / denom;
        var s = _s / denom;
        // var x = a1[0] + t * (a2[0] - a1[0]);
        // var y = a1[1] + t * (a2[1] - a1[1]);
                
        if ((t < 0 || t > 1 || s < 0 || s > 1) || (_t === 0 && _s === 0)) {
            return false;
        }
        
        return true;
    },
    
    /**
     * 충돌감지 보고를 받을 객체를 등록
     * 
     * @param {collie.DisplayObject} oDisplayObject 등록된 객체들과 충돌 감지할 객체
     * @param {String} sCategory 여러 개의 카테고리 입력 가능, 구분은 콤마(,)
     * @param {Function} fBeginCallback 충돌이 일어났을 때 실행될 함수
     * @param {collie.DisplayObject} fBeginCallback.listener 리스너 객체
     * @param {collie.DisplayObject} fBeginCallback.trigger 충돌이 일어난 객체
     * @param {Function} fEndCallback 충돌이 끝났을 때 실행될 함수
     * @param {collie.DisplayObject} fEndCallback.listener 리스너 객체
     * @param {collie.DisplayObject} fEndCallback.trigger 충돌이 일어난 객체
     * @param {Number} vWidth 이 값만 있으면 radius, 원형으로 탐지하고, 
     * @param {Number} nHeight vWidth와 같이 이 값도 있으면 중심으로 부터의 사각형으로 탐지한다.
     */
    addListener : function (oDisplayObject, sCategory, fBeginCallback, fEndCallback, vWidth, nHeight) {
        this._aListeners.push({
            category : sCategory,
            displayObject : oDisplayObject,
            beginCallback : fBeginCallback,
            endCallback : fEndCallback
        });
        
        this._addCustomArea(oDisplayObject, vWidth, nHeight);
        
        // 디버깅 모드면 영역을 표시
        if (this._htOption.useDebug) {
            this._drawArea(oDisplayObject, true, vWidth, nHeight);
        }
    },
    
    /**
     * 충돌 감지에 객체 등록
     * 
     * @param {collie.DisplayObject} oDisplayObject
     * @param {String} sCategory 여러 개의 카테고리 입력 가능, 구분은 콤마(,)
     * @param {Number} vWidth 이 값만 있으면 radius, 원형으로 탐지하고, 
     * @param {Number} nHeight vWidth와 같이 이 값도 있으면 중심으로 부터의 사각형으로 탐지한다.
     */
    add : function (oDisplayObject, sCategory, vWidth, nHeight) {
        if (sCategory.indexOf(",") !== -1) {
            var aCategories = sCategory.split(",");
            
            for (var i = 0, l = aCategories.length; i < l; i++) {
                this.add(oDisplayObject, aCategories[i], vWidth, nHeight);
            }
        } else {
            this._htObject[sCategory] = this._htObject[sCategory] || [];
            this._htObject[sCategory].push(oDisplayObject);
            this._addCustomArea(oDisplayObject, vWidth, nHeight);
            
            // 디버깅 모드면 영역을 표시
            if (this._htOption.useDebug) {
                this._drawArea(oDisplayObject, false, vWidth, nHeight);
            }
        }
    },
    
    /**
     * 충돌 감지에서 제거
     * 
     * @param {collie.DisplayObject} oDisplayObject
     * @param {String} sCategory 여러 개의 카테고리 입력 가능, 구분은 콤마(,), 값이 없을 시에는 모든 카테고리에서 제거
     */
    remove : function (oDisplayObject, sCategory) {
        if (!sCategory) {
            for (var i in this._htObject) {
                this.remove(oDisplayObject, i);
            }
        } else if (sCategory.indexOf(",") !== -1) {
            var aCategories = sCategory.split(",");
            
            for (var i = 0, l = aCategories.length; i < l; i++) {
                this.remove(oDisplayObject, aCategories[i]);
            }
        } else if (this._htObject[sCategory]) {
            for (var i = 0, l = this._htObject[sCategory].length; i < l; i++) {
                if (this._htObject[sCategory][i] === oDisplayObject) {
                    if (this._htCustomAreaCircle[oDisplayObject.getId()]) {
                        delete this._htCustomAreaCircle[oDisplayObject];
                    }
                    
                    if (this._htCustomAreaBox[oDisplayObject.getId()]) {
                        delete this._htCustomAreaBox[oDisplayObject];
                    }
                    
                    this._htObject[sCategory].splice(i, 1);
                    break;
                }
            }
        }
    },
    
    /**
     * @private
     * @param {collie.DisplayObject} oDisplayObject 대상 객체
     * @param {Number} vWidth 이 값만 있으면 radius, 원형으로 탐지하고, 
     * @param {Number} nHeight vWidth와 같이 이 값도 있으면 중심으로 부터의 사각형으로 탐지한다.
     */
    _addCustomArea : function (oDisplayObject, vWidth, nHeight) {
        // 사각형
        if (typeof nHeight !== "undefined") {
            this._htCustomAreaBox[oDisplayObject.getId()] = Math.sqrt(Math.pow(vWidth, 2) + Math.pow(nHeight, 2)); // 대각선 길이 
        } else if (typeof vWidth !== "undefined") { // 원형
            this._htCustomAreaCircle[oDisplayObject.getId()] = vWidth; // 반지름 길이
        }
    },
    
    /**
     * 감지 시작
     */
    start : function () {
        collie.Renderer.attach("process", this._fUpdate);
    },
    
    /**
     * 감지 끝
     */
    stop : function () {
        collie.Renderer.detach("process", this._fUpdate);
        this._nCurrentFrame = null;
        this._nAccumulateFrame = 0;
    },
    
    /**
     * collie.Renderer의 process 이벤트 리스너
     * @private
     */
    _onProcess : function (e) {
        this.update(e.frame);
    },
    
    /**
     * 충돌 영역을 그림
     * 
     * @private
     * @param {Boolean} bListener 리스너 여부
     */
    _drawArea : function (oDisplayObject, bListener, vWidth, nHeight) {
        var sColor = bListener ? this._htOption.debugListenerColor : this._htOption.debugColor;
        var id = oDisplayObject.getId();
        
        if (this._htCustomAreaCircle[id]) {
            var circle = new collie.Circle({
                radius : this._htCustomAreaCircle[id],
                fillColor : sColor,
                opacity : this._htOption.debugOpacity
            }).addTo(oDisplayObject);
            
            circle.center(oDisplayObject._htOption.width / 2, oDisplayObject._htOption.height / 2);
        } else if (this._htCustomAreaBox[id]) {
            new collie.DisplayObject({
                x : vWidth,
                y : nHeight,
                width : oDisplayObject._htOption.width - vWidth * 2,
                height : oDisplayObject._htOption.height - nHeight * 2,
                backgroundColor : sColor,
                opacity : this._htOption.debugOpacity
            }).addTo(oDisplayObject);
        } else {
            new collie.DisplayObject({
                width : oDisplayObject._htOption.width,
                height : oDisplayObject._htOption.height,
                backgroundColor : sColor,
                opacity : this._htOption.debugOpacity
            }).addTo(oDisplayObject);
        }
    }
}, collie.Component);
;
/**
 * 2D Tiled Map
 * - 2D Tiled Map is optimized canvas rendering. so you should set renderingMode option as "canvas" in a layer. but an object layer doesn't need to set canvas rendering.
 * @class
 * @extends collie.Component
 * @param {Number} nTileWidth 타일 1개의 너비
 * @param {Number} nTileHeight 타일 1개의 높이
 * @param {Object} htOption
 * @param {Boolean} [htOption.useEvent=true] 맵을 움직이는 이벤트를 사용한다
 * @param {Boolean} [htOption.useCache=false] Canvas를 사용할 때, 맵의 크기가 작을 경우 전체 사이즈를 미리 만들어 놓는 방식을 사용한다
 * @param {Boolean} [htOption.useLiveUpdate=false] 맵을 움직이는 중간에 타일을 업데이트 한다
 * @param {Number} [htOption.updateInterval=150] 업데이트 주기를 설정한다. 단위는 ms
 * @param {Boolean} [htOption.useLimitMoving=true] 맵을 벗어나게 움직일 수 없음
 * @param {Number} [htOption.cacheTileSize=1] 화면 범위 밖의 타일을 사방에 해당 사이즈 크기만큼 미리 생성함
 * @requires collie.addon.js
 * @example
// Make random data
var rowLength = 20;
var colLength = 20;
var objectCount = 10;
var tileSize = 30; // px
var mapData = [];
for (var row = 0; row < rowLength; row++) {
    var rowData = [];
    for (var col = 0; col < colLength; col++) {
        rowData.push({
            backgroundColor: Math.random() > 0.5 ? "red" : "yellow" // A Tile data doesn't necessary to contain dimension and position.
        });
    }
    mapData.push(rowData);
}

// Create a Map instance
var map = new collie.Map(tileSize, tileSize, {
    useEvent: true,
    useLiveUpdate : false
}).addTo(layer).addObjectTo(objectLayer);

// Add a mapdata.
map.setMapData(mapData);

// Add objects for display on the map.
for (var i = 0; i < objectCount; i++) {
    var tileX = Math.round(Math.random() * (colLength - 1));
    var tileY = Math.round(Math.random() * (rowLength - 1));
    var pos = map.getTileIndexToPos(tileX, tileY);
    map.addObject(tileX, tileY, new collie.DisplayObject({
        x : pos.x + 5,
        y : pos.y + 5,
        width : tileSize - 10,
        height : tileSize - 10,
        backgroundColor : "blue"
    }));
}

// Attach a event handler.
map.attach({
    mapclick : function (e) {
        console.log(e.tileX, e.tileY);
    }
});
 */
collie.Map = collie.Class(/** @lends collie.Map.prototype */{
    /**
     * @constructs
     */
    $init : function (nTileWidth, nTileHeight, htOption) {
        this._oLayer = null;
        this._oObjectLayer = null;
        this._fOnMousemove = this._onMousemove.bind(this);
        this._fOnMouseup = this._onMouseup.bind(this);
        this._fOnMousedown = this._onMousedown.bind(this);
        this._fOnClick = this._onClick.bind(this);
        this._fOnResize = this._onResize.bind(this);
        this._nTileWidth = nTileWidth;
        this._nTileHeight = nTileHeight;
        this._nStartMouseX = null;
        this._nStartMouseY = null;
        this._nStartContainerX = null;
        this._nStartContainerY = null;
        this._bIsMousedown = false;
        this._bLockScreen = false;
        this._nRowLength = 0;
        this._nColLength = 0;
        this._aMapData = [];
        this._aTiles = [];
        this._htTile = {};
        this._htObject = {};
        this._htEventInfo = {};
        this._sRenderingMode = null;
        this._oPool = new collie.Pool();
        this._oContainer = new collie.DisplayObject();
        this._htContainerInfo = this._oContainer.get();
        this._oObjectContainer = new collie.DisplayObject();
        this._htLayerOption = null;
        this.option({
            cacheTileSize : 1,
            useCache : false,
            updateInterval : 150,
            useLiveUpdate : false,
            useEvent : true,
            useLimitMoving : true
        });
        
        this._oTimerUpdate = collie.Timer.repeat(this._prepareTile.bind(this), this._htOption.updateInterval, {
            useAutoStart : false
        });
        
        
        this.optionSetter("useEvent", this._setterUseEvent.bind(this));
        this.optionSetter("updateInterval", function (v) {
            this._oTimerUpdate.setDuration(v);
        }.bind(this));
        
        if (typeof htOption !== "undefined") {
            this.option(htOption);
        }
        
        this._setterUseEvent(this._htOption.useEvent);
    },
    
    /**
     * 레이어에 바로 추가한다.
     * 인터페이스의 통일성을 위해 추가함
     * 
     * @param {collie.Layer} oLayer
     * @return {collie.Map} 메서드 체이닝을 위한 반환 값
     */
    addTo : function (oLayer) {
        this.setLayer(oLayer);
        return this;
    },
    
    /**
     * 레이어에 Object을 바로 추가한다.
     * 인터페이스의 통일성을 위해 추가함
     * 
     * @param {collie.Layer} oLayer
     * @return {collie.Map} 메서드 체이닝을 위한 반환 값
     */
    addObjectTo : function (oLayer) {
        this.setObjectLayer(oLayer);
        return this;
    },
    
    /**
     * Map을 추가할 레이어를 설정한다
     * @param {collie.Layer} oLayer
     */
    setLayer : function (oLayer) {
        // 기존에 등록된 레이어가 있다면 제거
        if (this._oLayer !== null) {
            this.unsetLayer();
        }
        
        // 모바일에서 DOM모드에 Map을 쓸 수 없음
        // if (oLayer.getRenderingMode() === "dom" && !collie.util.getDeviceInfo().desktop) {
            // throw new Error("The collie.Map doesn't support DOM mode in mobile devices");
        // }
        
        this._oLayer = oLayer;
        this._htLayerOption = this._oLayer._htOption;
        this._sRenderingMode = this._oLayer.getRenderingMode();
        this._oLayer.attach("resize", this._fOnResize);
        
        if (this._htOption.useEvent) {
            this._oLayer.attach("mousemove", this._fOnMousemove);
            this._oLayer.attach("mouseup", this._fOnMouseup);
            this._oLayer.attach("mousedown", this._fOnMousedown);
            this._oLayer.attach("click", this._fOnClick);
        }
        
        this._oContainer.addTo(oLayer);
        this._prepareStage();
    },
    
    /**
     * @private
     */
    _prepareStage : function () {
        var nContainerWidth = this._htLayerOption.width;
        var nContainerHeight = this._htLayerOption.height;
        var bUseCache = false;
        var nPoolSize = 0;
        
        if (this._htOption.useCache && this._sRenderingMode === "canvas") {
            nContainerWidth = this._nTileWidth * this._nColLength,
            nContainerHeight = this._nTileHeight * this._nRowLength,
            bUseCache = true;
            nPoolSize = this._nColLength * this._nRowLength;
        } else {
            var nColCount = Math.ceil(this._htLayerOption.width / this._nTileWidth) + 2;
            var nRowCount = Math.ceil(this._htLayerOption.height / this._nTileHeight) + 2;
            nPoolSize = (nColCount + this._htOption.cacheTileSize * 2) * (nRowCount + this._htOption.cacheTileSize * 2);            
        }
        
        this._oContainer.set({
            width : nContainerWidth,
            height : nContainerHeight,
            useCache : bUseCache
        });
            
        // pool 사이즈를 화면 크기에 맞게 변경
        this._oPool.changeSize(nPoolSize);
        
        if (bUseCache) {
            this._prepareTileWithCache();
        } else {
            this._prepareTile();
        }
    },
    
    /**
     * Map을 레이어에서 제거한다
     */
    unsetLayer : function () {
        if (this._oLayer !== null) {
            this._oLayer.detach("resize", this._fOnResize);
            
            if (this._htOption.useEvent) {
                this._oLayer.detach("mousemove", this._fOnMousemove);
                this._oLayer.detach("mouseup", this._fOnMouseup);
                this._oLayer.detach("mousedown", this._fOnMousedown);
                this._oLayer.detach("click", this._fOnClick);
            }
            
            this._oContainer.leave();
            this._oLayer = null;
            this._sRenderingMode = null;
        }
    },
    
    /**
     * Object을 추가할 레이어를 설정한다
     * @param {collie.Layer} oLayer
     */
    setObjectLayer : function (oLayer) {
        // 기존에 등록된 레이어가 있다면 제거
        if (this._oObjectLayer !== null) {
            this.unsetObjectLayer();
        }
        
        this._oObjectLayer = oLayer;
        this._oObjectContainer.addTo(this._oObjectLayer);
        this._oObjectContainer.set({
            width : this._oObjectLayer._htOption.width,
            height : this._oObjectLayer._htOption.height
        });
    },
    
    /**
     * Object을 레이어에서 제거한다
     */
    unsetObjectLayer : function () {
        if (this._oObjectLayer !== null) {
            this._oObjectContainer.leave();
            this._oObjectLayer = null;
        }
    },
    
    /**
     * @return {collie.DisplayObject} 컨테이너 DisplayObject를 반환
     */
    getContainer : function () {
        return this._oContainer;
    },
    
    /**
     * @return {collie.DisplayObject} Object 컨테이너 DisplayObject를 반환
     */
    getObjectContainer : function () {
        return this._oObjectContainer;
    },
    
    /**
     * Container의 위치를 설정한다
     * 
     * @param {Number} nX
     * @param {Number} nY
     */
    setPosition : function (nX, nY) {
        if (this._bLockScreen) {
            return false;
        }
        
        if (this._htOption.useLimitMoving) {
            nX = Math.max(-this._nColLength * this._nTileWidth + this._htLayerOption.width, nX);
            nY = Math.max(-this._nRowLength * this._nTileHeight + this._htLayerOption.height, nY);
            nX = Math.min(0, nX);
            nY = Math.min(0, nY);
        }
        
        nX = Math.round(nX);
        nY = Math.round(nY);
        this._oContainer.set("x", nX);
        this._oContainer.set("y", nY);
        this._htEventInfo.x = nX;
        this._htEventInfo.y = nY;
        
        // action이 활성화 돼 있다면 action도 같이 이동
        if (this._oObjectLayer !== null) {
            this._oObjectContainer.set("x", nX);
            this._oObjectContainer.set("y", nY);
        }
    },
    
    /**
     * Container의 위치를 반환한다
     * 
     * @return {Object} htResult
     * @return {Number} htResult.x
     * @return {Number} htResult.y
     */
    getPosition : function () {
        return {
            x : this._htContainerInfo.x,
            y : this._htContainerInfo.y
        };
    },
    
    /**
     * tileX 길이를 반환
     * 
     * @param {Number}
     */
    getTileXLength : function () {
        return this._nColLength;
    },
    
    /**
     * tileY 길이를 반환
     * 
     * @param {Number}
     */
    getTileYLength : function () {
        return this._nRowLength;
    },
    
    /**
     * 맵을 일괄적으로 생성한다
     * @param {Array} aMapData 맵 데이터 array[row][col] = htOption
     */
    setMapData : function (aMapData) {
        this._aMapData = aMapData;
        
        for (var row = 0, rowLength = this._aMapData.length; row < rowLength; row++) {
            for (var col = 0, colLength = this._aMapData[row].length; col < colLength; col++) {
                this._appendTileOption(col, row, this._aMapData[row][col]);
            }
        }
        
        this._cacheTileLength();
        this._prepareStage();
    },
    
    /**
     * 맵 데이터를 초기화 한다
     */
    unsetMapData : function () {
        this._aMapData = null;
    },
    
    /**
     * 맵을 개별적으로 생성한다
     * 
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @param {Object} htOption
     */
    addTile : function (nTileX, nTileY, htOption) {
        htOption = htOption || {};
        this._aMapData[nTileY] = this._aMapData[nTileY] || [];
        
        // 이미 있는 타일이면 먼저 제거
        if (this._aMapData[nTileY][nTileX]) {
            this.removeTile(nTileX, nTileY);
        }
        
        this._appendTileOption(nTileX, nTileY, htOption);
        this._aMapData[nTileY][nTileX] = htOption;
        this._cacheTileLength();
    },
    
    /**
     * 타일 정보에 시스템 옵션을 삽입
     * 
     * @private
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @param {Object} htOption
     */
    _appendTileOption : function (nTileX, nTileY, htOption) {
        htOption.width = this._nTileWidth;
        htOption.height = this._nTileHeight;
        htOption.x = nTileX * this._nTileWidth;
        htOption.y = nTileY * this._nTileHeight;
        htOption.tileX = nTileX;
        htOption.tileY = nTileY;
    },
    
    /**
     * 타일에 객체를 추가
     * 
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @param {collie.DisplayObject} oDisplayObject
     */
    addObject : function (nTileX, nTileY, oDisplayObject) {
        // 이미 추가된 객체라면 해당 타일에서 제거
        if (typeof oDisplayObject._htOption.tileX !== "undefined" && oDisplayObject._htOption.tileX !== null) {
            this.removeObject(oDisplayObject);
        }
        
        oDisplayObject.set("mapObject", this);
        this._addObjectToTile(nTileX, nTileY, oDisplayObject);
    },
    
    /**
     * 보여지는 영역에 속하는지 확인
     * 
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @return {Boolean}
     */
    isVisibleOffset : function (nTileX, nTileY) {
        return (this._htOption.useCache && this._sRenderingMode === "canvas") || (
            this._htEventInfo.startTileX <= nTileX &&
            this._htEventInfo.endTileX >= nTileX &&
            this._htEventInfo.startTileY <= nTileY &&
            this._htEventInfo.endTileY >= nTileY
        );
    },
    
    /**
     * @private
     */
    _addObjectToTile : function (nTileX, nTileY, oDisplayObject) {
        this._htObject[nTileY] = this._htObject[nTileY] || {};
        this._htObject[nTileY][nTileX] = this._htObject[nTileY][nTileX] || [];
        this._htObject[nTileY][nTileX].push(oDisplayObject);
        oDisplayObject.set("tileX", nTileX);
        oDisplayObject.set("tileY", nTileY);
        
        // 현재 보여지는 영역에 있으면 바로 추가
        if (!oDisplayObject.getParent() && this.isVisibleOffset(nTileX, nTileY)) {
            oDisplayObject.addTo(this._oObjectContainer);
        }
    },
    
    /**
     * 등록돼 있는 객체를 옮김
     * 
     * @param {Number} nTileX 옮길 타일 x
     * @param {Number} nTileY 옮길 타일 y
     * @param {collie.DisplayObject} 타일에 등록돼 있는 객체
     */
    moveObject : function (nTileX, nTileY, oDisplayObject) {
        if (typeof oDisplayObject._htOption.tileX !== "undefined" && oDisplayObject._htOption.tileX !== null) {
            this._removeObjectFromTile(oDisplayObject, this.isVisibleOffset(nTileX, nTileY));
            this._addObjectToTile(nTileX, nTileY, oDisplayObject);
        }
    },
    
    /**
     * 타일에서 객체를 제거
     * 
     * @param {collie.DisplayObject} oDisplayObject
     */
    removeObject : function (oDisplayObject) {
        oDisplayObject.leave();
        oDisplayObject.set("mapObject", null);
        this._removeObjectFromTile(oDisplayObject);
    },
    
    /**
     * @private
     * @param {collie.DisplayObject} oDisplayObject 타일에 등록돼 있는 객체
     * @param {Boolean} bSkipRemove 화면에서 제거하는 과정을 생략한다
     */
    _removeObjectFromTile : function (oDisplayObject, bSkipRemove) {
        var nTileX = oDisplayObject._htOption.tileX;
        var nTileY = oDisplayObject._htOption.tileY;
        oDisplayObject.set("tileX", null);
        oDisplayObject.set("tileY", null);
        
        if (this._htObject[nTileY] && this._htObject[nTileY][nTileX]) {
            for (var i = 0, l = this._htObject[nTileY][nTileX].length; i < l; i++) {
                if (this._htObject[nTileY][nTileX][i] === oDisplayObject) {
                    this._htObject[nTileY][nTileX].splice(i, 1);
                    break;
                }
            }
        }
        
        // 화면에서 제거
        if (!bSkipRemove && !this.isVisibleOffset(nTileX, nTileY) && oDisplayObject.getParent()) {
            oDisplayObject.leave(); 
        }
    },
    
    /**
     * 화면을 움직이지 않게 한다
     * 
     * @return {collie.Map}
     */
    lock : function () {
        this._bLockScreen = true;
        return this;
    },
    
    /**
     * 화면을 움직이게 한다
     * 
     * @return {collie.Map}
     */
    unlock : function () {
        this._bLockScreen = false;
        return this;
    },
    
    /**
     * 타일의 zIndex를 구한다
     * 
     * @private
     * @return {Number}
     */
    _getTileZIndex : function (tileX, tileY) {
        return 10 + tileY;
    },
    
    /**
     * 타일 길이를 구해놓는다
     * @private
     */
    _cacheTileLength : function () {
        this._nRowLength = this._aMapData.length;
        this._nColLength = this._aMapData[this._nRowLength - 1].length;
    },
    
    /**
     * 타일을 지운다
     * 
     * @param {Number} nTileX
     * @param {Number} nTileY
     */
    removeTile : function (nTileX, nTileY) {
        if (this._aMapData[nTileY] && this._aMapData[nTileY][nTileX]) {
            delete this._aMapData[nTileY][nTileX];
        }
    },
    
    /**
     * 해당 타일의 옵션을 변경한다
     * 
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @param {Object} htOption 기존 옵션이 사라지는 것이 아니고 중첩된다
     */
    changeTile : function (nTileX, nTileY, htOption) {
        var htTile = this.getTile(nTileX, nTileY);
        
        if (htTile && htOption) {
            for (var i in htOption) {
                htTile[i] = htOption[i];
            }
            
            // 현재 타일이 만들어져 있으면 수정
            if (this._htTile[nTileY] && this._htTile[nTileY][nTileX]) {
                this._htTile[nTileY][nTileX].set(htOption);
            }
        }
    },
    
    /**
     * 타일을 가져온다
     * 
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @return {Object|Boolean} DisplayObject가 반환되지 않고 타일 정보가 반환 됨
     */
    getTile : function (nTileX, nTileY) {
        return (this._aMapData[nTileY] && this._aMapData[nTileY][nTileX]) ? this._aMapData[nTileY][nTileX] : false;
        // return (this._htTile[nTileY] && this._htTile[nTileY][nTileX]) ? this._htTile[nTileY][nTileX] : false;
    },
    
    /**
     * 해당 타일을 둘러싼 타일 목록을 구한다
     * 
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @return {Array} DisplayObject가 반환되지 않고 타일 정보가 반환 됨
     */
    getSurroundedTiles : function (nTileX, nTileY) {
        var aTiles = [];
        var top = this.getTile(nTileX, nTileY - 1);
        var bottom = this.getTile(nTileX, nTileY + 1);
        var left = this.getTile(nTileX - 1, nTileY);
        var right = this.getTile(nTileX + 1, nTileY);
        
        if (top) {
            aTiles.push(top);
        }
        
        if (right) {
            aTiles.push(right);
        }
        
        if (bottom) {
            aTiles.push(bottom);
        }
        
        if (left) {
            aTiles.push(left);
        }
        
        return aTiles;
    },
    
    /**
     * 해당 좌표에 등록된 객체를 가져온다
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @return {Array|Boolean}
     */
    getObjects : function (nTileX, nTileY) {
        return this._htObject[nTileY] && this._htObject[nTileY][nTileX] ? this._htObject[nTileY][nTileX] : false;
    },
    
    /**
     * 필터를 이용해 해당 좌표에 등록된 객체를 가져온다
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @param {Function} fFilter
     * @return {collie.DisplayObject|Boolean}
     */
    getObject : function (nTileX, nTileY, fFilter) {
        if (this.hasObject(nTileX, nTileY)) {
            for (var i = 0, l = this._htObject[nTileY][nTileX].length; i < l; i++) {
                if (fFilter(this._htObject[nTileY][nTileX][i]) === true) {
                    return this._htObject[nTileY][nTileX][i];
                }
            }
        }
        
        return false;
    },
    
    /**
     * 해당 좌표에 객체가 있는지 반환
     * 
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @param {Function} fFilter
     * @return {Boolean}
     */
    hasObject : function (nTileX, nTileY, fFilter) {
        var isObject = this._htObject[nTileY] && this._htObject[nTileY][nTileX] && this._htObject[nTileY][nTileX].length;
        
        if (isObject && fFilter) {
            for (var i = 0, l = this._htObject[nTileY][nTileX].length; i < l; i++) {
                if (fFilter(this._htObject[nTileY][nTileX][i]) === true) {
                    return true;
                }
            }
            
            return false;
        }
        
        return isObject;
    },
    
    /**
     * 화면 안으로 들어온 객체 처리
     * @private
     * @param {Number} nTileX
     * @param {Number} nTileY
     */
    _enterObject : function (nTileX, nTileY) {
        var objects = this.getObjects(nTileX, nTileY);
        
        if (objects) {
            for (var i = 0, l = objects.length; i < l; i++) {
                objects[i].addTo(this._oObjectContainer);
            }
        }
    },
    
    /**
     * 화면 밖으로 나간 객체 처리
     * @private
     * @param {Number} nTileX
     * @param {Number} nTileY
     */
    _leaveObject : function (nTileX, nTileY) {
        var objects = this.getObjects(nTileX, nTileY);
        
        if (objects) {
            for (var i = 0, l = objects.length; i < l; i++) {
                objects[i].leave();
            }
        }
    },
    
    /**
     * 타일 인덱스로 포지션을 구함
     * 
     * @param {Number} nTileX
     * @param {Number} nTileY
     * @return {Object} htResult
     * @return {Number} htResult.x
     * @return {Number} htResult.y
     */
    getTileIndexToPos : function (nTileX, nTileY) {
        return {
            x : nTileX * this._nTileWidth,
            y : nTileY * this._nTileHeight
        };
    },
    
    /**
     * 포지션으로 타일 인덱스를 구함
     * 
     * @param {Number} nX
     * @param {Number} nY
     * @return {Object} htResult
     * @return {Number} htResult.tileX
     * @return {Number} htResult.tileY
     */
    getPosToTileIndex : function (nX, nY) {
        return {
            tileX : Math.floor(nX / this._nTileWidth),
            tileY : Math.floor(nY / this._nTileHeight)
        };
    },
    
    /**
     * @private
     */
    _setterUseEvent : function (bUseEvent) {
        // 레이어가 등록돼 있다면 바로 이벤트를 등록
        if (this._oLayer !== null) {
            if (bUseEvent) {
                this._oLayer.attach("mousemove", this._fOnMousemove);
                this._oLayer.attach("mouseup", this._fOnMouseup);
                this._oLayer.attach("mousedown", this._fOnMousedown);
                this._oLayer.attach("click", this._fOnClick);
            } else {
                this._oLayer.detach("mousemove", this._fOnMousemove);
                this._oLayer.detach("mouseup", this._fOnMouseup);
                this._oLayer.detach("mousedown", this._fOnMousedown);
                this._oLayer.detach("click", this._fOnClick);
            }
        }
    },
    
    _onMousemove : function (e) {
        /**
         * 맵이 이동할 떄
         * @name collie.Map#mapmove
         * @event
         * @param {Object} htEvent
         * @param {Number} htEvent.x 컨테이너 x 좌표
         * @param {Number} htEvent.y 컨테이너 y 좌표
         * @param {HTMLEvent} htEvent.event 이벤트 객체
         */
        if (this._bIsMousedown && this.fireEvent("mapmove", this._htEventInfo) !== false) {
            this.setPosition(this._nStartContainerX + (e.x - this._nStartMouseX), this._nStartContainerY + (e.y - this._nStartMouseY));
        }
    },
    
    _onMousedown : function (e) {
        this._htEventInfo.eventX = e.x;
        this._htEventInfo.eventY = e.y;
        
        /**
         * 맵에 마우스나 터치를 시작했을 때
         * @name collie.Map#mapdown
         * @event
         * @param {Object} htEvent
         * @param {Number} htEvent.x 컨테이너 x 좌표
         * @param {Number} htEvent.y 컨테이너 y 좌표
         * @param {Number} htEvent.eventX 이벤트 x 좌표
         * @param {Number} htEvent.eventY 이벤트 y 좌표
         * @param {HTMLEvent} htEvent.event 이벤트 객체
         */
        if (this.fireEvent("mapdown", this._htEventInfo) === false) {
            return;
        }
        
        this._bIsMousedown = true;
        this._nStartMouseX = e.x;
        this._nStartMouseY = e.y;
        this._nStartContainerX = this._htContainerInfo.x;
        this._nStartContainerY = this._htContainerInfo.y;
        
        if (this._htOption.useLiveUpdate && (!this._htOption.useCache || this._sRenderingMode !== "canvas")) {
            this._oTimerUpdate.start();
        }
    },
    
    _onMouseup : function (e) {
        if (this._bIsMousedown) {
            this._nStartMouseX = null;
            this._nStartMouseY = null;
            this._nStartContainerX = null;
            this._nStartContainerY = null;
            this._bIsMousedown = false;
            
            if (this._htOption.useLiveUpdate) {
                this._oTimerUpdate.pause();
            } else if (!this._htOption.useCache || this._sRenderingMode !== "canvas") {
                this._prepareTile();
            }
            
            this._htEventInfo.eventX = e.x;
            this._htEventInfo.eventY = e.y;
            
            /**
             * 맵에 마우스나 터치가 끝났을 때
             * @name collie.Map#mapup
             * @event
             * @param {Object} htEvent
             * @param {Number} htEvent.x 컨테이너 x 좌표
             * @param {Number} htEvent.y 컨테이너 y 좌표
             * @param {Number} htEvent.eventX 이벤트 x 좌표
             * @param {Number} htEvent.eventY 이벤트 y 좌표
             * @param {HTMLEvent} htEvent.event 이벤트 객체
             */
            this.fireEvent("mapup", this._htEventInfo);
        }
    },
    
    /**
     * @private
     */
    _onClick : function (e) {
        var nX = e.x - this._htContainerInfo.x;
        var nY = e.y - this._htContainerInfo.y;
        var tileIndex = this.getPosToTileIndex(nX, nY);
        this._htEventInfo.eventX = e.x;
        this._htEventInfo.eventY = e.y;
        this._htEventInfo.tileX = tileIndex.tileX;
        this._htEventInfo.tileY = tileIndex.tileY;
        
        /**
         * 맵을 클릭했을 때
         * @name collie.Map#mapclick
         * @event
         * @param {Object} htEvent
         * @param {Number} htEvent.x 컨테이너 x 좌표
         * @param {Number} htEvent.y 컨테이너 y 좌표
         * @param {Number} htEvent.eventX 이벤트 x 좌표
         * @param {Number} htEvent.eventY 이벤트 y 좌표
         * @param {Number} htEvent.tileX 타일 x 인덱스
         * @param {Number} htEvent.tileY 타일 y 인덱스
         * @param {HTMLEvent} htEvent.event 이벤트 객체
         */
        this.fireEvent("mapclick", this._htEventInfo);
    },
    
    /**
     * @private
     */
    _onResize : function () {
        if (this._oObjectLayer !== null) {
            this._oObjectContainer.set({
                width : this._oObjectLayer._htOption.width,
                height : this._oObjectLayer._htOption.height
            });
        }
        
        this._prepareStage();
    },
    
    /**
     * 타일 생성
     * @private
     * @param {Number} nTileX
     * @param {Number} nTileY
     */
    _createTile : function (nTileX, nTileY) {
        if ((!this._htTile[nTileY] || !this._htTile[nTileY][nTileX]) && this._aMapData[nTileY] && this._aMapData[nTileY][nTileX]) {
            var tile = this._oPool.get().addTo(this._oContainer);
            tile.set(this._aMapData[nTileY][nTileX]);
            this._htTile[nTileY] = this._htTile[nTileY] || {};
            this._htTile[nTileY][nTileX] = this._htTile[nTileY][nTileX] = tile;
            this._aTiles.push(tile);
            this._enterObject(nTileX, nTileY);
        }
    },
    
    /**
     * 화면 밖으로 나간 타일 회수
     * @private
     * @param {Number} startTileX
     * @param {Number} startTileY
     * @param {Number} endTileX
     * @param {Number} endTileY
     * @return {Boolean} 회수 됐는지 여부
     */
    _releaseTiles : function (startTileX, startTileY, endTileX, endTileY) {
        var tile;
        var bChanged = false;
        
        for (var i = 0; i < this._aTiles.length; i++) {
            tile = this._aTiles[i];
            
            if (
                startTileX > tile._htOption.tileX ||
                tile._htOption.tileX > endTileX ||
                startTileY > tile._htOption.tileY ||
                tile._htOption.tileY > endTileY
            ) {
                delete this._htTile[tile._htOption.tileY][tile._htOption.tileX];
                this._oPool.release(tile);
                this._aTiles.splice(i, 1);
                this._leaveObject(tile._htOption.tileX, tile._htOption.tileY);
                i--;
                bChanged = true;
            }
        }
        
        return bChanged;
    },
    
    /**
     * useCache를 쓰고 있을 떄 타일 준비
     * @private
     */
    _prepareTileWithCache : function () {
        for (var row = 0; row < this._nRowLength; row++) {
            for (var col = 0; col < this._nColLength; col++) {
                this._createTile(col, row);
            }
        }
        
        /**
         * 맵의 타일이 변경됐을 때
         * @name collie.Map#mapchange
         * @event
         * @param {Object} htEvent
         * @param {Number} htEvent.x 컨테이너 x 좌표
         * @param {Number} htEvent.y 컨테이너 y 좌표
         * @param {HTMLEvent} htEvent.event 이벤트 객체
         */
        this.fireEvent("mapchange", this._htEventInfo);
    },
    
    /**
     * 컨테이너 위치에 따라서 타일을 다시 구성
     * @private
     */
    _prepareTile : function () {
        if (!this._aMapData.length) {
            return false;
        }
        
        var startTileX = Math.max(0, Math.floor(-this._htContainerInfo.x / this._nTileWidth) - this._htOption.cacheTileSize);
        var startTileY = Math.max(0, Math.floor(-this._htContainerInfo.y / this._nTileHeight) - this._htOption.cacheTileSize);
        var endTileX = Math.min(this._nColLength - 1, Math.floor((-this._htContainerInfo.x + this._htLayerOption.width) / this._nTileWidth) + this._htOption.cacheTileSize);
        var endTileY = Math.min(this._nRowLength - 1, Math.floor((-this._htContainerInfo.y + this._htLayerOption.height) / this._nTileHeight) + this._htOption.cacheTileSize);
        var tile;
        this._htEventInfo.startTileX = startTileX;
        this._htEventInfo.startTileY = startTileY;
        this._htEventInfo.endTileX = endTileX;
        this._htEventInfo.endTileY = endTileY;
        
        // 나간 타일 회수
        var bChanged = this._releaseTiles(startTileX, startTileY, endTileX, endTileY);
        
        // 없는 타일 생성
        for (var row = startTileY; row <= endTileY; row++) {
            for (var col = startTileX; col <= endTileX; col++) {
                this._createTile(col, row);
            }
        }
        
        // 바뀐게 있다면 이벤트 발생
        if (bChanged) {
            /**
             * 맵의 타일이 변경됐을 때
             * @name collie.Map#mapchange
             * @event
             * @param {Object} htEvent
             * @param {Number} htEvent.x 컨테이너 x 좌표
             * @param {Number} htEvent.y 컨테이너 y 좌표
             * @param {Number} htEvent.startTileX 현재 화면 안에 있는 타일의 시작 인덱스
             * @param {Number} htEvent.startTileY 현재 화면 안에 있는 타일의 시작 인덱스
             * @param {Number} htEvent.endTileX 현재 화면 안에 있는 타일의 끝 인덱스
             * @param {Number} htEvent.endTileY 현재 화면 안에 있는 타일의 끝 인덱스
             * @param {HTMLEvent} htEvent.event 이벤트 객체
             */
            this.fireEvent("mapchange", this._htEventInfo);
        }
    },
    
    /**
     * 한 화면에 보이는 최대 타일 갯수 반환
     * 
     * @return {Number}
     */
    getTileCountOnScreen : function () {
        var nColCount = Math.ceil(this._htLayerOption.width / this._nTileWidth) + 2;
        var nRowCount = Math.ceil(this._htLayerOption.height / this._nTileHeight) + 2;
        return nColCount * nRowCount;
    }
}, collie.Component);
;

;

;
/**
 * Path Finding with collie.Map
 * @class
 * @extends collie.Component
 * @param {collie.Map} oMap
 * @param {Function} fBeforeMove 해당 타일에 이동해도 되는지 판단하는 함수, 이동할 수 없다면 false를 반환해야 한다
 * @param {Object} fBeforeMove.tile 이동하려는 타일 정보, DisplayObject가 아님
 * @param {collie.Map} fBeforeMove.map 맵
 * @requires collie.addon.js
 * @example
var finder = new collie.PathFinding(map, function (tile, map) {
    if (tile.isBlock) { // isBlock is a custom option.
        return false;
    }
    
    // you can make a custom logic for checking a tile that you can go by return false. 
    ...
});

// You can get array as [[x, y], [x, y] ...].
var aPath = finder.find(0, 0, 5, 5); // startTileX, startTileY, endTileX, endTileY
console.log(aPath);

// If you want to find what a tile you can go, you can use a beforeMove method
if (finder.beforeMove(map.getTile(5, 5))) {
    console.log("I can go there!");
}
 */
collie.PathFinding = collie.Class(/** @lends collie.PathFinding.prototype */{
    /**
     * @constructs
     */
    $init : function (oMap, fBeforeMove) {
        this._oMap = oMap;
        this._fBeforeMove = fBeforeMove;
    },
    
    /**
     * 길찾기
     * 
     * @param {Number} nFromTileX
     * @param {Number} nFromTileY
     * @param {Number} nToTileX
     * @param {Number} nToTileY
     * @return {Array|Boolean} [[x1, y1], [x2, y2], ... ]
     */
    find : function (nFromTileX, nFromTileY, nToTileX, nToTileY) {
        // 넓이를 최대 횟수로 잡음
        var nLimitCount = Math.max(this._oMap.getTileCountOnScreen(), Math.pow(collie.util.getDistance(nFromTileX, nFromTileY, nToTileX, nToTileY) * 2, 2));
        var nCount = 0;
        var nCurrentTileX = nFromTileX;
        var nCurrentTileY = nFromTileY;
        var aPath = [];
        this._sFilter = '';
        
        // 진행
        while (nCurrentTileX !== nToTileX || nCurrentTileY !== nToTileY) {
            nCount++;
            
            // 너무 많이 진행되면 취소
            if (nCount > nLimitCount) {
                return false;
            }
            
            var aTiles = this._oMap.getSurroundedTiles(nCurrentTileX, nCurrentTileY);
            var nMinDistance = null;
            var oSelectedTile = null;
            
            // 길 선택
            for (var i = 0, l = aTiles.length; i < l; i++) {
                // 못가는데면 지나침
                if (!aTiles[i] || !this.beforeMove(aTiles[i]) || this._isInFilter(aTiles[i])) {
                    continue;
                }
                
                // 거리 계산
                var nDistance = collie.util.getDistance(aTiles[i].tileX, aTiles[i].tileY, nToTileX, nToTileY);
                
                // 작은 것 등록
                if (oSelectedTile === null || nDistance < nMinDistance) {
                    nMinDistance = nDistance;
                    oSelectedTile = aTiles[i];
                }
            }
            
            // 선택된 것이 있으면
            if (oSelectedTile !== null) {
                nCurrentTileX = oSelectedTile.tileX;
                nCurrentTileY = oSelectedTile.tileY;
                
                // 움직였으면 path에 등록
                aPath.push([nCurrentTileX, nCurrentTileY]);
                
                this._sFilter += "[" + nCurrentTileX + "," + nCurrentTileY + "]";
            // 막혔으면
            } else {
                this._sFilter += "[" + nCurrentTileX + "," + nCurrentTileY + "]";
                
                // 뒤로 돌아갈 수 있다면 돌아감
                if (aPath.length > 0) {
                    var beforePath = aPath.pop();
                    nCurrentTileX = beforePath[0];
                    nCurrentTileY = beforePath[1];
                    continue;
                } else {
                    // 더이상 갈길이 없을 경우는 움직이지 못함
                    return false;
                }
            }
        }

        // 패스 반환
        return (aPath.length > 0) ? aPath : false;
    },
    
    /**
     * 움직일 수 있는 타일인지 확인
     * 
     * @param {Object} htTile displayObject가 아니라 tile 정보 객체
     * @return {Boolean}
     */
    beforeMove : function (htTile) {
        return this._fBeforeMove(htTile, this._oMap) === false ? false : true;
    },
    
    /**
     * @return {collie.Map}
     */
    getMap : function () {
        return this._oMap;
    },
    
    /**
     * 대상 타일이 거쳐온 곳인지 체크
     * 
     * @private
     * @param {Object} htTile 대상 타일 정보 객체
     * @return {Boolean}
     */
    _isInFilter : function (htTile) {
        return this._sFilter.indexOf("[" + htTile.tileX + "," + htTile.tileY + "]") !== -1;
    }
}, collie.Component);